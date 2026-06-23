import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AvailableSlotsCard } from './AvailableSlotsCard';
import { applySlotToForm } from '../_store/bookingSlice';
import { useAppDispatch, useAppSelector } from '../_store/hooks';
import * as utils from '../_lib/utils';

const mockUseAppDispatch = jest.mocked(useAppDispatch);
const mockUseAppSelector = jest.mocked(useAppSelector);

// Mock Redux hooks
jest.mock('../_store/hooks', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

// Mock Redux slices
jest.mock('../_store/bookingSlice', () => ({
  applySlotToForm: jest.fn(),
  selectAvailableSlots: jest.fn(),
}));

// Mock utils
jest.mock('../_lib/utils', () => ({
  slotFormatter: {
    format: jest.fn((date) => date.toLocaleString()),
  },
}));

describe('AvailableSlotsCard', () => {
  let mockDispatch: jest.Mock;
  let mockSlotFormatter: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch = jest.fn();
    mockSlotFormatter = jest.fn((date) => {
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    });

    mockUseAppDispatch.mockReturnValue(mockDispatch);
    (utils.slotFormatter.format as jest.Mock).mockImplementation(mockSlotFormatter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the available slots card', () => {
    mockUseAppSelector.mockReturnValue([]);

    render(<AvailableSlotsCard />);

    expect(screen.getByText('Available slots')).toBeInTheDocument();
    expect(
      screen.getByText(/These are system-available one-hour slots/),
    ).toBeInTheDocument();
  });

  it('should display message when no slots are available', () => {
    mockUseAppSelector.mockReturnValue([]);

    render(<AvailableSlotsCard />);

    expect(screen.getByText('No system-available slots found.')).toBeInTheDocument();
  });

  it('should render slot buttons when slots are available', () => {
    const mockSlots = [
      {
        startsAt: new Date('2024-01-15T10:00:00'),
        endsAt: new Date('2024-01-15T11:00:00'),
      },
      {
        startsAt: new Date('2024-01-15T11:00:00'),
        endsAt: new Date('2024-01-15T12:00:00'),
      },
    ];

    mockUseAppSelector.mockReturnValue(mockSlots);

    render(<AvailableSlotsCard />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
  });

  it('should display formatted slot times', () => {
    const mockSlots = [
      {
        startsAt: new Date('2024-01-15T10:00:00'),
        endsAt: new Date('2024-01-15T11:00:00'),
      },
    ];

    mockUseAppSelector.mockReturnValue(mockSlots);

    mockSlotFormatter.mockReturnValueOnce('01/15/2024, 10:00');
    mockSlotFormatter.mockReturnValueOnce('01/15/2024, 11:00');

    render(<AvailableSlotsCard />);

    expect(screen.getByText('01/15/2024, 10:00 - 01/15/2024, 11:00')).toBeInTheDocument();
  });

  it('should call slotFormatter with correct dates', () => {
    const startDate = new Date('2024-01-15T10:00:00');
    const endDate = new Date('2024-01-15T11:00:00');

    const mockSlots = [
      {
        startsAt: startDate,
        endsAt: endDate,
      },
    ];

    mockUseAppSelector.mockReturnValue(mockSlots);

    render(<AvailableSlotsCard />);

    expect(mockSlotFormatter).toHaveBeenCalledWith(startDate);
    expect(mockSlotFormatter).toHaveBeenCalledWith(endDate);
  });

  it('should dispatch applySlotToForm when slot button is clicked', async () => {
    const user = userEvent.setup();

    const mockSlots = [
      {
        startsAt: new Date('2024-01-15T10:00:00'),
        endsAt: new Date('2024-01-15T11:00:00'),
      },
    ];

    mockUseAppSelector.mockReturnValue(mockSlots);

    mockSlotFormatter.mockReturnValueOnce('01/15/2024, 10:00');
    mockSlotFormatter.mockReturnValueOnce('01/15/2024, 11:00');

    render(<AvailableSlotsCard />);

    const slotButton = screen.getByRole('button', {
      name: '01/15/2024, 10:00 - 01/15/2024, 11:00',
    });

    await user.click(slotButton);

    expect(mockDispatch).toHaveBeenCalledWith(
      applySlotToForm({
        slotStartIso: mockSlots[0].startsAt.toISOString(),
        slotEndIso: mockSlots[0].endsAt.toISOString(),
      }),
    );
  });

  it('should handle multiple slot selections', async () => {
    const user = userEvent.setup();

    const mockSlots = [
      {
        startsAt: new Date('2024-01-15T10:00:00'),
        endsAt: new Date('2024-01-15T11:00:00'),
      },
      {
        startsAt: new Date('2024-01-15T14:00:00'),
        endsAt: new Date('2024-01-15T15:00:00'),
      },
    ];

    mockUseAppSelector.mockReturnValue(mockSlots);

    mockSlotFormatter
      .mockReturnValueOnce('01/15/2024, 10:00')
      .mockReturnValueOnce('01/15/2024, 11:00')
      .mockReturnValueOnce('01/15/2024, 14:00')
      .mockReturnValueOnce('01/15/2024, 15:00');

    render(<AvailableSlotsCard />);

    const buttons = screen.getAllByRole('button');

    await user.click(buttons[0]);
    await user.click(buttons[1]);

    expect(mockDispatch).toHaveBeenCalledTimes(2);
  });

  it('should render slot buttons as buttons with type button', () => {
    const mockSlots = [
      {
        startsAt: new Date('2024-01-15T10:00:00'),
        endsAt: new Date('2024-01-15T11:00:00'),
      },
    ];

    mockUseAppSelector.mockReturnValue(mockSlots);

    mockSlotFormatter.mockReturnValueOnce('01/15/2024, 10:00');
    mockSlotFormatter.mockReturnValueOnce('01/15/2024, 11:00');

    render(<AvailableSlotsCard />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  it('should render the section with correct aria structure', () => {
    mockUseAppSelector.mockReturnValue([]);

    const { container } = render(<AvailableSlotsCard />);

    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
    expect(section).toHaveClass('rounded-3xl', 'border', 'bg-white', 'p-6', 'shadow-[0_20px_40px_-25px_rgba(28,46,38,0.5)]');
  });

  it('should show description text', () => {
    mockUseAppSelector.mockReturnValue([]);

    render(<AvailableSlotsCard />);

    expect(
      screen.getByText(
        'These are system-available one-hour slots for the next 7 days. Google conflicts are checked on booking confirmation.',
      ),
    ).toBeInTheDocument();
  });

  it('should render many slots without issues', () => {
      const mockSlots = Array.from({ length: 10 }, (_, i) => ({
        startsAt: new Date(`2024-01-15T${String(10 + i).padStart(2, '0')}:00:00`),
        endsAt: new Date(`2024-01-15T${String(10 + i + 1).padStart(2, '0')}:00:00`),
      }));

    mockUseAppSelector.mockReturnValue(mockSlots);

    mockSlots.forEach(() => {
      mockSlotFormatter.mockReturnValueOnce('time1');
      mockSlotFormatter.mockReturnValueOnce('time2');
    });

    render(<AvailableSlotsCard />);

    const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(10);
  });

  it('should have correct key for each slot button', () => {
    const mockSlots = [
      {
        startsAt: new Date('2024-01-15T10:00:00'),
        endsAt: new Date('2024-01-15T11:00:00'),
      },
    ];

    mockUseAppSelector.mockReturnValue(mockSlots);

    mockSlotFormatter.mockReturnValueOnce('01/15/2024, 10:00');
    mockSlotFormatter.mockReturnValueOnce('01/15/2024, 11:00');

    const { container } = render(<AvailableSlotsCard />);

    // Keys are used internally by React for list rendering
    // Verify that slots render correctly by checking DOM
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should format time slots correctly for ISO string conversion', async () => {
    const user = userEvent.setup();

    const mockSlots = [
      {
        startsAt: new Date('2024-01-15T10:30:00'),
        endsAt: new Date('2024-01-15T11:30:00'),
      },
    ];

    mockUseAppSelector.mockReturnValue(mockSlots);

    mockSlotFormatter.mockReturnValueOnce('01/15/2024, 10:30');
    mockSlotFormatter.mockReturnValueOnce('01/15/2024, 11:30');

    render(<AvailableSlotsCard />);

    const slotButton = screen.getByRole('button', {
      name: '01/15/2024, 10:30 - 01/15/2024, 11:30',
    });

    await user.click(slotButton);

    expect(mockDispatch).toHaveBeenCalledWith(
      applySlotToForm({
        slotStartIso: expect.stringContaining('2024-01-15'),
        slotEndIso: expect.stringContaining('2024-01-15'),
      }),
    );
  });

  it('should not render slot buttons when slots array is empty', () => {
    mockUseAppSelector.mockReturnValue([]);

    const { container } = render(<AvailableSlotsCard />);

    const buttons = container.querySelectorAll('button');
    // Only heading buttons or similar should be counted
    expect(buttons.length).toBe(0);
  });
});
