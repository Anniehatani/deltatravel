import { describe, it, expect } from 'vitest';
import { ConfigService } from '@nestjs/config';
import {
  Gateways,
  hmac,
  verifyMac,
  vnpCanonical,
  momoCanonical,
  vietnamDate,
} from '../../src/payments/gateways';
import { hashPassword, checkPassword } from '../../src/auth/password';
describe('payment signatures', () => {
  const config = new ConfigService({
    VNPAY_TMN_CODE: 'TESTCODE',
    VNPAY_HASH_SECRET: 'secret',
    MOMO_ACCESS_KEY: 'access',
    MOMO_PARTNER_CODE: 'partner',
    MOMO_SECRET_KEY: 'secret',
    ZALOPAY_APP_ID: '2553',
    ZALOPAY_KEY2: 'secret',
  });
  const gateway = new Gateways(config);
  it('matches the independent RFC 4231 HMAC-SHA256 test vector', () => {
    expect(hmac('sha256', 'Jefe', 'what do ya want for nothing?')).toBe(
      '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843',
    );
  });
  it('rejects invalid length and non-hex signatures', () => {
    expect(verifyMac('abcd', 'ab')).toBe(false);
    expect(verifyMac('abcd', 'zzzz')).toBe(false);
  });
  it('formats dates in Vietnam timezone including midnight rollover', () =>
    expect(vietnamDate(new Date('2026-09-16T18:00:00Z'))).toBe('20260917010000'));
  it('accepts signed VNPay and rejects an altered amount', () => {
    const fields = {
      vnp_TmnCode: 'TESTCODE',
      vnp_Amount: '25000000',
      vnp_TxnRef: 'ref',
      vnp_TransactionNo: '123',
      vnp_ResponseCode: '00',
      vnp_TransactionStatus: '00',
    };
    const signature = hmac('sha512', 'secret', vnpCanonical(fields));
    expect(gateway.verifyVnpay({ ...fields, vnp_SecureHash: signature }).amount).toBe(250000n);
    expect(() =>
      gateway.verifyVnpay({ ...fields, vnp_Amount: '100', vnp_SecureHash: signature }),
    ).toThrow();
  });
  it('does not accept just one VNPay success flag', () => {
    const p = {
      vnp_TmnCode: 'TESTCODE',
      vnp_Amount: '10000',
      vnp_TxnRef: 'ref',
      vnp_TransactionNo: '123',
      vnp_ResponseCode: '00',
      vnp_TransactionStatus: '02',
    };
    expect(
      gateway.verifyVnpay({ ...p, vnp_SecureHash: hmac('sha512', 'secret', vnpCanonical(p)) })
        .success,
    ).toBe(false);
  });
  it('rejects duplicate query keys represented as arrays', () =>
    expect(() => gateway.verifyVnpay({ vnp_Amount: ['100', '200'] })).toThrow());
  it('validates MoMo signature and merchant', () => {
    const p = {
      amount: '1000',
      extraData: '',
      message: 'OK',
      orderId: 'ref',
      orderInfo: 'Tour',
      orderType: 'momo_wallet',
      partnerCode: 'partner',
      payType: 'qr',
      requestId: 'req',
      responseTime: '123',
      resultCode: '0',
      transId: '555',
    };
    expect(
      gateway.verifyMomo({ ...p, signature: hmac('sha256', 'secret', momoCanonical('access', p)) })
        .success,
    ).toBe(true);
    expect(
      gateway.verifyMomo({
        ...p,
        promotionInfo: [{ voucherType: 'Amount', amount: 100 }],
        signature: hmac('sha256', 'secret', momoCanonical('access', p)),
      }).success,
    ).toBe(true);
    expect(() =>
      gateway.verifyMomo({
        ...p,
        partnerCode: 'attacker',
        signature: hmac('sha256', 'secret', momoCanonical('access', p)),
      }),
    ).toThrow();
  });
  it('validates ZaloPay using the exact data string', () => {
    const data = JSON.stringify({
      app_id: 2553,
      app_trans_id: 'ref',
      zp_trans_id: 123,
      amount: 1000,
    });
    const mac = hmac('sha256', 'secret', data);
    expect(gateway.verifyZalopay({ data, mac }).success).toBe(true);
    expect(() => gateway.verifyZalopay({ data: data + ' ', mac })).toThrow();
  });
});
describe('password storage', () => {
  it('salts password hashes and verifies only the correct password', async () => {
    const a = await hashPassword('twelve-characters-password');
    const b = await hashPassword('twelve-characters-password');
    expect(a).not.toBe(b);
    expect(await checkPassword('twelve-characters-password', a)).toBe(true);
    expect(await checkPassword('wrong', a)).toBe(false);
  });
});
