import { commandQueue } from './commandQueue';
import { MessageRequest, MessageResponse, VirtualNumber } from '../types/cpaas';
import { getIdentity } from './identityService';
import { listVirtualNumbers } from './virtualNumberService';

async function sendViaTwilio(to: string, from: string, text: string): Promise<any> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    // If Twilio credentials aren't set in .env, simulate successful API dispatch for CPaaS testing
    console.log(`[GatewayService - Twilio Simulation] Sending SMS to ${to} from ${from}: "${text}"`);
    return {
      sid: `SM${Math.random().toString(36).substring(2, 15)}`,
      status: 'queued',
      to,
      from,
      body: text,
      cost: 0.0075
    };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const params = new URLSearchParams({
    To: to,
    From: from,
    Body: text,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Twilio error: ${errorText}`);
  }

  return response.json();
}

async function sendViaAndroid(to: string, text: string, workspaceId: string): Promise<string> {
  const founderIdentity = await getIdentity('silajaneiro9@gmail.com');
  const activeAndroidDevice = founderIdentity?.devices?.find(d => d.isActive && d.platform.toLowerCase().includes('android'));

  const nodeId = activeAndroidDevice?.deviceId || 'node-angola-luanda-01';

  const commandId = commandQueue.enqueue({
    nodeId,
    workspaceId,
    type: 'SEND_SMS',
    payload: { phoneNumber: to, text, to },
  });

  return commandId;
}

async function getWorkspaceDefaultNumber(workspaceId: string): Promise<VirtualNumber | null> {
  const numbers = await listVirtualNumbers(workspaceId);
  const assigned = numbers.find(n => n.status === 'assigned');
  return assigned || numbers[0] || null;
}

export async function sendMessage(req: MessageRequest, workspaceId: string): Promise<MessageResponse> {
  const { to, text, priority = 'normal' } = req;
  let from = req.from;
  const messageId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  try {
    // 1. Attempt Android node (zero cost) for normal priority
    if (priority === 'normal' || priority === 'low') {
      try {
        const commandId = await sendViaAndroid(to, text, workspaceId);
        return {
          messageId,
          status: 'queued',
          gateway: 'android',
          cost: 0
        };
      } catch (androidError) {
        console.warn('[GatewayService] Android node dispatch failed, falling back to Twilio:', androidError);
      }
    }

    // 2. Fallback to Cloud/Twilio Gateway
    if (!from) {
      const virtualNumber = await getWorkspaceDefaultNumber(workspaceId);
      from = virtualNumber ? virtualNumber.number : (process.env.TWILIO_PHONE_NUMBER || '+244900000000');
    }

    const twilioResult = await sendViaTwilio(to, from, text);
    return {
      messageId: twilioResult.sid || messageId,
      status: 'sent',
      gateway: 'twilio',
      cost: 0.0075,
    };
  } catch (error: any) {
    return {
      messageId,
      status: 'failed',
      gateway: 'none',
      error: error.message || 'Falha na transmissão da mensagem',
    };
  }
}
