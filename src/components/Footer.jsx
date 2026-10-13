import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const Footer = () => {
  return (
    <footer style={{
      backgroundColor: '#ffffff',
      borderTop: '1px solid var(--border-subtle)',
      padding: '40px 24px 30px'
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            backgroundColor: 'var(--crimson-700)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff'
          }}>
            <ShieldCheck size={18} />
          </div>
          <div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--crimson-800)' }}>
              Oakridge Academy
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
              School Operations Management Platform
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Enterprise Academic Administration & Concurrency-Safe Records
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
          &copy; {new Date().getFullYear()} Oakridge Academy. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
