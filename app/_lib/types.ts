export type GoogleCredentialResponse = {
  credential?: string;
};

export type GoogleUser = {
  email: string;
  name?: string;
};

export type Booking = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
};

export type TakenSlot = {
  id: string;
  startsAt: string;
  endsAt: string;
};

export type TimeSlot = {
  startsAt: Date;
  endsAt: Date;
};
