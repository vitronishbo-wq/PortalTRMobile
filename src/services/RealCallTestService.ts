/* RealCallTestService — Testes Reais Estritos de Áudio, WebRTC e Mídia */
// SEM MÉTRICAS FICTÍCIAS: Qualquer teste sem execução física é NOT_TESTED / NOT_AVAILABLE

export type RealCallTestResult = 'PASSED' | 'FAILED' | 'NOT_AVAILABLE' | 'NOT_TESTED' | 'AWAITING_PROVIDER' | 'AWAITING_ANDROID_AGENT';

export interface CallDiagnosticStep {
  test: 'WebRTC' | 'SIP' | 'IMS' | 'Microfone' | 'Altifalante' | 'Áudio bidirecional';
  result: RealCallTestResult;
  latencyMs?: number;
  details: string;
}

export interface RealCallMetrics {
  durationSeconds: number;
  latencyMs?: number;
  jitterMs?: number;
  packetLossPercent?: number;
  micState: 'ONLINE' | 'MUTED' | 'UNAVAILABLE' | 'DENIED' | 'NOT_TESTED';
  speakerState: 'OPERATIONAL' | 'SUSPENDED' | 'UNAVAILABLE' | 'NOT_TESTED';
  audioQuality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'UNAVAILABLE' | 'NOT_TESTED';
}

export interface RealCallTestSuiteResult {
  overall: RealCallTestResult;
  timestamp: number;
  steps: CallDiagnosticStep[];
  metrics: RealCallMetrics;
}

export class RealCallTestService {
  /**
   * Executa diagnóstico estrito de chamada sem métricas sintéticas
   */
  public static async executeFullCallDiagnostic(): Promise<RealCallTestSuiteResult> {
    const steps: CallDiagnosticStep[] = [];
    const now = Date.now();
    const startTime = performance.now();

    // 1. WebRTC RTCPeerConnection Check
    const hasWebRTC = typeof RTCPeerConnection !== 'undefined';
    let webrtcPassed = false;

    if (hasWebRTC) {
      try {
        const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        pc.createDataChannel('telecom-latency-test');
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        pc.close();
        webrtcPassed = true;
        steps.push({
          test: 'WebRTC',
          result: 'PASSED',
          details: 'RTCPeerConnection local instanciada e SDP gerado com sucesso'
        });
      } catch (e: any) {
        steps.push({
          test: 'WebRTC',
          result: 'FAILED',
          details: `Falha ao criar RTCPeerConnection: ${e.message}`
        });
      }
    } else {
      steps.push({
        test: 'WebRTC',
        result: 'NOT_AVAILABLE',
        details: 'API RTCPeerConnection não disponível no navegador'
      });
    }

    // 2. Microfone
    let micPassed = false;
    let micState: RealCallMetrics['micState'] = 'NOT_TESTED';
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const tracks = stream.getAudioTracks();
        if (tracks.length > 0 && tracks[0].enabled) {
          micPassed = true;
          micState = 'ONLINE';
          tracks.forEach(t => t.stop());
          steps.push({
            test: 'Microfone',
            result: 'PASSED',
            details: `Acesso a microfone capturado (${tracks[0].label || 'Dispositivo Padrão'})`
          });
        } else {
          micState = 'MUTED';
          steps.push({
            test: 'Microfone',
            result: 'FAILED',
            details: 'Nenhuma faixa de áudio ativa retornada'
          });
        }
      } catch (e: any) {
        micState = 'DENIED';
        steps.push({
          test: 'Microfone',
          result: 'NOT_AVAILABLE',
          details: `Permissão ou hardware de microfone indisponível: ${e.message || 'Negado'}`
        });
      }
    } else {
      steps.push({
        test: 'Microfone',
        result: 'NOT_AVAILABLE',
        details: 'API navigator.mediaDevices indisponível'
      });
    }

    // 3. Altifalante / AudioContext
    let speakerPassed = false;
    let speakerState: RealCallMetrics['speakerState'] = 'NOT_TESTED';
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'running' || ctx.state === 'suspended') {
          speakerPassed = true;
          speakerState = 'OPERATIONAL';
          steps.push({
            test: 'Altifalante',
            result: 'PASSED',
            details: `AudioContext inicializado (${ctx.sampleRate}Hz)`
          });
          ctx.close();
        }
      } else {
        steps.push({
          test: 'Altifalante',
          result: 'NOT_AVAILABLE',
          details: 'AudioContext não suportado'
        });
      }
    } catch (e: any) {
      speakerState = 'SUSPENDED';
      steps.push({
        test: 'Altifalante',
        result: 'FAILED',
        details: `Erro no AudioContext: ${e.message}`
      });
    }

    // 4. Áudio Bidirecional
    if (micPassed && speakerPassed && webrtcPassed) {
      steps.push({
        test: 'Áudio bidirecional',
        result: 'NOT_TESTED',
        details: 'Requer chamada com nó remoto ou terminal SIP conectado para medição de áudio'
      });
    } else {
      steps.push({
        test: 'Áudio bidirecional',
        result: 'NOT_AVAILABLE',
        details: 'Requer microfone e altifalante disponíveis'
      });
    }

    // 5. SIP Trunk
    steps.push({
      test: 'SIP',
      result: 'AWAITING_PROVIDER',
      details: 'Tronco SIP de operadora não configurado'
    });

    // 6. IMS VoLTE Core
    steps.push({
      test: 'IMS',
      result: 'AWAITING_ANDROID_AGENT',
      details: 'Requer agente Android nativo com SIM ativo e registro VoLTE'
    });

    const durationSeconds = Number(((performance.now() - startTime) / 1000).toFixed(2));

    const metrics: RealCallMetrics = {
      durationSeconds,
      micState,
      speakerState,
      audioQuality: 'NOT_TESTED'
    };

    return {
      overall: 'NOT_TESTED',
      timestamp: now,
      steps,
      metrics
    };
  }
}
