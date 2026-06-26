/**
 * GlassesHud — 600×600 high-contrast display layout for Ray-Ban Meta
 * Display Web Apps Dev Mode.
 *
 * Design constraints:
 * - Fixed 600×600 canvas (the glasses display viewport)
 * - Black background, high-contrast white/yellow/green text only
 * - No animations > 30fps (display refresh limitation)
 * - Minimal DOM — glasses GPU is limited
 * - Font min 18px for legibility at arm's length
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { leadsApi } from '../services/api';

const HUD_STYLE = {
  width: 600,
  height: 600,
  background: '#000000',
  color: '#FFFFFF',
  fontFamily: 'Arial, sans-serif',
  fontSize: 18,
  overflow: 'hidden',
  position: 'relative',
  userSelect: 'none',
};

const STATUS_COLORS = {
  'New': '#60A5FA',
  'Contacted': '#A78BFA',
  'Qualified': '#34D399',
  'Proposal Sent': '#FBBF24',
  'Negotiation': '#F97316',
  'Closed Won': '#22C55E',
  'Closed Lost': '#EF4444',
};

function ScoreDot({ score }) {
  const color = score >= 8 ? '#22C55E' : score >= 6 ? '#FBBF24' : score >= 4 ? '#F97316' : '#EF4444';
  return (
    <span style={{
      display: 'inline-block', width: 12, height: 12, borderRadius: '50%',
      background: color, marginRight: 6, verticalAlign: 'middle',
    }} />
  );
}

function LeadRow({ lead, index }) {
  const statusColor = STATUS_COLORS[lead.status] || '#FFFFFF';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 16px',
      background: index % 2 === 0 ? '#111111' : '#000000',
      borderLeft: `3px solid ${statusColor}`,
    }}>
      {lead.aiScore && <ScoreDot score={lead.aiScore} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {lead.name}
        </div>
        <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 1 }}>
          {lead.company || '—'} · <span style={{ color: statusColor }}>{lead.status}</span>
        </div>
      </div>
      {lead.value && (
        <div style={{ fontSize: 14, color: '#FBBF24', fontWeight: 700, flexShrink: 0 }}>
          ${Number(lead.value).toLocaleString()}
        </div>
      )}
    </div>
  );
}

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span style={{ fontSize: 13, color: '#6B7280' }}>
      {time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
    </span>
  );
}

export default function GlassesHud() {
  // Stale leads — no activity in 14+ days
  const { data: leadsData } = useQuery({
    queryKey: ['hud-leads'],
    queryFn: () => leadsApi.list({ stale: '1', archived: 'false', take: 6 }).then(r => r.data),
    refetchInterval: 30_000,
  });

  // Top scored active leads
  const { data: topData } = useQuery({
    queryKey: ['hud-top'],
    queryFn: () => leadsApi.list({ archived: 'false', take: 4 }).then(r => r.data),
    refetchInterval: 30_000,
  });

  const staleLeads = Array.isArray(leadsData) ? leadsData : (leadsData?.leads || []);
  const topLeads = Array.isArray(topData) ? topData : (topData?.leads || []);

  // Sort top leads by AI score desc
  const sorted = [...topLeads].sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0)).slice(0, 4);

  return (
    <div style={HUD_STYLE}>
      {/* Header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', background: '#111827',
        borderBottom: '1px solid #1F2937',
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#6366F1', letterSpacing: 1 }}>
          ◈ SALESFLOW
        </div>
        <Clock />
      </div>

      {/* Stale leads alert */}
      {staleLeads.length > 0 && (
        <div style={{ padding: '8px 16px', background: '#1C1100', borderBottom: '1px solid #78350F' }}>
          <div style={{ fontSize: 12, color: '#FBBF24', fontWeight: 700, marginBottom: 4, letterSpacing: 1 }}>
            ⚠ NEEDS ATTENTION — {staleLeads.length} STALE LEAD{staleLeads.length > 1 ? 'S' : ''}
          </div>
          {staleLeads.slice(0, 2).map(l => (
            <div key={l.id} style={{ fontSize: 13, color: '#FCD34D', marginTop: 2 }}>
              · {l.name}{l.company ? ` (${l.company})` : ''}
            </div>
          ))}
          {staleLeads.length > 2 && (
            <div style={{ fontSize: 12, color: '#92400E', marginTop: 2 }}>
              + {staleLeads.length - 2} more
            </div>
          )}
        </div>
      )}

      {/* Top leads section */}
      <div style={{ padding: '8px 16px 4px', fontSize: 11, color: '#4B5563', letterSpacing: 1, fontWeight: 700 }}>
        TOP ACTIVE LEADS
      </div>
      <div>
        {sorted.map((lead, i) => <LeadRow key={lead.id} lead={lead} index={i} />)}
        {sorted.length === 0 && (
          <div style={{ padding: '12px 16px', fontSize: 14, color: '#4B5563' }}>No active leads</div>
        )}
      </div>

      {/* Footer — mic hint */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '10px 16px', background: '#0A0A0A',
        borderTop: '1px solid #1F2937',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: 12, color: '#374151' }}>
          🎙 Hold glasses btn to capture
        </div>
        <div style={{ fontSize: 12, color: '#374151' }}>
          salesflow.app/hud
        </div>
      </div>
    </div>
  );
}
