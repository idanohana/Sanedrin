export type GuestSide = "חתן" | "כלה" | "משותף";
export type RsvpStatus = "מגיע" | "לא מגיע" | "טרם ענה";
export type TableShape = "round" | "rectangular";

export type EventRecord = {
  id: string;
  user_id: string;
  groom_name: string;
  bride_name: string;
  event_date: string;
  groom_phone: string | null;
  bride_phone: string | null;
  created_at: string;
};

export type TableRecord = {
  id: string;
  event_id: string;
  table_number: number;
  capacity: number;
  shape: TableShape;
  pos_x: number;
  pos_y: number;
  created_at: string;
};

export type GuestRecord = {
  id: string;
  event_id: string;
  full_name: string;
  phone_number: string;
  side: GuestSide;
  group_tag: string;
  invited_pax: number;
  confirmed_pax: number;
  rsvp_status: RsvpStatus;
  table_id: string | null;
  rsvp_token: string;
  created_at: string;
};

export type DraftGuest = {
  id: string;
  full_name: string;
  phone_number: string;
  side: GuestSide;
  group_tag: string;
  invited_pax: number;
};

export type RsvpContext = {
  guest: {
    id: string;
    full_name: string;
    invited_pax: number;
    confirmed_pax: number;
    rsvp_status: RsvpStatus;
  };
  event: {
    groom_name: string;
    bride_name: string;
    event_date: string;
  };
};
