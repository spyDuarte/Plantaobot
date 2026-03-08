import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import CapturedTab from './CapturedTab.jsx';

const captured = [
  {
    id: 'shift-1',
    hospital: 'Hospital Central',
    group: 'Grupo A',
    date: '2026-03-05',
    hours: '07h-19h',
    dist: 12,
    spec: 'Clinica',
    val: 1800,
    sc: 91,
  },
];

describe('CapturedTab', () => {
  it('allows exporting and sharing captured shifts', () => {
    const exportCSV = vi.fn();
    const onShareCaptured = vi.fn();

    render(
      <CapturedTab
        uiV2
        captured={captured}
        rejected={[]}
        total={1800}
        exportCSV={exportCSV}
        onShareCaptured={onShareCaptured}
        setModal={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Compartilhar Relatório' }));
    fireEvent.click(screen.getByRole('button', { name: 'Exportar (CSV)' }));

    expect(onShareCaptured).toHaveBeenCalledTimes(1);
    expect(exportCSV).toHaveBeenCalledTimes(1);
  });

  it('shows empty state when there are no captured shifts', () => {
    render(
      <CapturedTab
        uiV2
        captured={[]}
        rejected={[]}
        total={0}
        exportCSV={vi.fn()}
        onShareCaptured={vi.fn()}
        setModal={vi.fn()}
      />,
    );

    expect(screen.getByText('Nenhum plantão capturado')).toBeInTheDocument();
  });
});
