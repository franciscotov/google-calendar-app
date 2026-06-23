import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateBookingCard } from './CreateBookingCard';
import {
  setEndsAt,
  setStartsAt,
  setTitle,
} from '../_store/bookingSlice';
import { useAppDispatch, useAppSelector } from '../_store/hooks';
import { createBookingEntry } from '../_store/thunks';

const mockUseAppDispatch = jest.mocked(useAppDispatch);
const mockUseAppSelector = jest.mocked(useAppSelector);

// Mock Redux hooks
jest.mock('../_store/hooks', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

// Mock Redux slices and thunks
jest.mock('../_store/bookingSlice', () => ({
  setEndsAt: jest.fn(),
  setStartsAt: jest.fn(),
  setTitle: jest.fn(),
}));

jest.mock('../_store/thunks', () => ({
  createBookingEntry: jest.fn(),
}));

describe('CreateBookingCard', () => {
  let mockDispatch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch = jest.fn();

    mockUseAppDispatch.mockReturnValue(mockDispatch);
    mockUseAppSelector.mockImplementation((selector) => {
      const mockState = {
        booking: {
          title: '',
          startsAt: '',
          endsAt: '',
        },
        auth: {
          googleAccessToken: 'test-token',
        },
        ui: {
          isBusy: false,
        },
      };
      return selector(mockState as unknown as Parameters<typeof selector>[0]);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the create booking card', () => {
    render(<CreateBookingCard />);

      expect(screen.getByRole('heading', { name: 'Create booking' })).toBeInTheDocument();
    expect(
      screen.getByText(/The backend verifies conflicts/),
    ).toBeInTheDocument();
  });

  it('should display input fields for title and datetime', () => {
    render(<CreateBookingCard />);

    expect(screen.getByPlaceholderText('Booking title')).toBeInTheDocument();
    expect(screen.getByLabelText(/Start/)).toBeInTheDocument();
    expect(screen.getByLabelText(/End/)).toBeInTheDocument();
  });

  it('should display create booking button', () => {
    render(<CreateBookingCard />);

    const button = screen.getByRole('button', { name: /Create booking/ });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('should dispatch setTitle when title input changes', async () => {
    const user = userEvent.setup();
    render(<CreateBookingCard />);

    const titleInput = screen.getByPlaceholderText('Booking title') as HTMLInputElement;
    await user.type(titleInput, 'Team Meeting');

    expect(mockDispatch).toHaveBeenCalledWith(setTitle('Team Meeting'));
  });

  it('should dispatch setStartsAt when start time input changes', async () => {
    const user = userEvent.setup();
    render(<CreateBookingCard />);

    const startInput = screen.getByLabelText(/Start/) as HTMLInputElement;
    await user.type(startInput, '2024-01-15T10:00');

    expect(mockDispatch).toHaveBeenCalledWith(setStartsAt('2024-01-15T10:00'));
  });

  it('should dispatch setEndsAt when end time input changes', async () => {
    const user = userEvent.setup();
    render(<CreateBookingCard />);

    const endInput = screen.getByLabelText(/End/) as HTMLInputElement;
    await user.type(endInput, '2024-01-15T11:00');

    expect(mockDispatch).toHaveBeenCalledWith(setEndsAt('2024-01-15T11:00'));
  });

  it('should dispatch createBookingEntry when create button is clicked', async () => {
    const user = userEvent.setup();
    render(<CreateBookingCard />);

    const button = screen.getByRole('button', { name: /Create booking/ });
    await user.click(button);

    expect(mockDispatch).toHaveBeenCalledWith(createBookingEntry());
  });

  it('should show warning message when calendar access is not granted', () => {
    mockUseAppSelector.mockImplementation((selector) => {
      const mockState = {
        booking: {
          title: '',
          startsAt: '',
          endsAt: '',
        },
        auth: {
          googleAccessToken: null,
        },
        ui: {
          isBusy: false,
        },
      };
      return selector(mockState as unknown as Parameters<typeof selector>[0]);
    });

    render(<CreateBookingCard />);

    expect(
      screen.getByText(/Grant Google Calendar permission above/),
    ).toBeInTheDocument();
  });

  it('should not show warning message when calendar access is granted', () => {
    mockUseAppSelector.mockImplementation((selector) => {
      const mockState = {
        booking: {
          title: '',
          startsAt: '',
          endsAt: '',
        },
        auth: {
          googleAccessToken: 'test-token',
        },
        ui: {
          isBusy: false,
        },
      };
      return selector(mockState as unknown as Parameters<typeof selector>[0]);
    });

    render(<CreateBookingCard />);

    expect(
      screen.queryByText(/Grant Google Calendar permission above/),
    ).not.toBeInTheDocument();
  });

  it('should disable button when isBusy is true', () => {
    mockUseAppSelector.mockImplementation((selector) => {
      const mockState = {
        booking: {
          title: '',
          startsAt: '',
          endsAt: '',
        },
        auth: {
          googleAccessToken: 'test-token',
        },
        ui: {
          isBusy: true,
        },
      };
      return selector(mockState as unknown as Parameters<typeof selector>[0]);
    });

    render(<CreateBookingCard />);

    const button = screen.getByRole('button', { name: /Create booking/ });
    expect(button).toBeDisabled();
  });

  it('should have correct button type', () => {
    render(<CreateBookingCard />);

    const button = screen.getByRole('button', { name: /Create booking/ });
    expect(button).toHaveAttribute('type', 'button');
  });

  it('should render all input fields with correct types', () => {
    render(<CreateBookingCard />);

    const titleInput = screen.getByPlaceholderText('Booking title');
    expect(titleInput).toHaveAttribute('type', 'text');

    const startInput = screen.getByLabelText(/Start/);
    expect(startInput).toHaveAttribute('type', 'datetime-local');

    const endInput = screen.getByLabelText(/End/);
    expect(endInput).toHaveAttribute('type', 'datetime-local');
  });

  it('should maintain input values from Redux state', () => {
    mockUseAppSelector.mockImplementation((selector) => {
      const mockState = {
        booking: {
          title: 'Previous Meeting',
          startsAt: '2024-01-15T10:00',
          endsAt: '2024-01-15T11:00',
        },
        auth: {
          googleAccessToken: 'test-token',
        },
        ui: {
          isBusy: false,
        },
      };
      return selector(mockState as unknown as Parameters<typeof selector>[0]);
    });

    render(<CreateBookingCard />);

    expect((screen.getByPlaceholderText('Booking title') as HTMLInputElement).value).toBe(
      'Previous Meeting',
    );
    expect((screen.getByLabelText(/Start/) as HTMLInputElement).value).toBe(
      '2024-01-15T10:00',
    );
    expect((screen.getByLabelText(/End/) as HTMLInputElement).value).toBe(
      '2024-01-15T11:00',
    );
  });

  it('should have accessible labels for datetime inputs', () => {
    render(<CreateBookingCard />);

    const startLabel = screen.getByText('Start');
    expect(startLabel).toBeInTheDocument();

    const endLabel = screen.getByText('End');
    expect(endLabel).toBeInTheDocument();
  });

  it('should show proper text content in the card', () => {
    render(<CreateBookingCard />);

    expect(screen.getByRole('heading', { name: 'Create booking' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'The backend verifies conflicts with system bookings and Google Calendar before confirming.',
      ),
    ).toBeInTheDocument();
  });

  it('should handle rapid button clicks', async () => {
    const user = userEvent.setup();
    render(<CreateBookingCard />);

    const button = screen.getByRole('button', { name: /Create booking/ });

    await user.click(button);
    await user.click(button);
    await user.click(button);

    expect(mockDispatch).toHaveBeenCalledTimes(3);
  });
});
