import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

jest.mock('resend');

describe('EmailService', () => {
  let service: EmailService;
  let mockResend: any;

  beforeEach(async () => {
    mockResend = {
      emails: {
        send: jest.fn(),
      },
    };

    (Resend as jest.Mock).mockImplementation(() => mockResend);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('mock-api-key') },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send email successfully', async () => {
    mockResend.emails.send.mockResolvedValue({ id: 'email-id' });

    await service.sendContractEmail(
      'babaoyeoladele@gmail.com',
      'John Doe',
      'https://contract.com',
    );

    expect(mockResend.emails.send).toHaveBeenCalledWith({
      from: 'Acme <onboarding@resend.dev>',
      to: ['babaoyeoladele@gmail.com'],
      subject: 'Your Job Contract is Ready!',
      html: expect.stringContaining('John Doe'),
    });
  });

  it('should retry on failure and eventually succeed', async () => {
    mockResend.emails.send
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ id: 'email-id' });

    await service.sendContractEmail(
      'babaoyeoladele@gmail.com',
      'John Doe',
      'https://contract.com',
    );

    expect(mockResend.emails.send).toHaveBeenCalledTimes(2);
  });

  it('should throw error after max retries', async () => {
    mockResend.emails.send.mockRejectedValue(new Error('Network error'));

    await expect(
      service.sendContractEmail(
        'babaoyeoladele@gmail.com',
        'John Doe',
        'https://contract.com',
      ),
    ).rejects.toThrow('Network error');

    expect(mockResend.emails.send).toHaveBeenCalledTimes(3);
  }, 10000);
});
