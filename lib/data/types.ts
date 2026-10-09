export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  phone: string | null;
  country: string | null;
  stageName: string | null;
  emailVerified: boolean;
  verifyToken: string | null;
  resetToken: string | null;
  resetExpires: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Beat = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  genre: string | null;
  mood: string | null;
  bpm: number | null;
  musicalKey: string | null;
  tags: string | null;
  coverImage: string | null;
  audioFile: string | null;
  previewFile: string | null;
  stemsFile: string | null;
  duration: number | null;
  plays: number;
  featured: boolean;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type BeatLicense = {
  id: string;
  beatId: string;
  tier: string;
  name: string;
  price: number;
  description: string | null;
  fileFormat: string | null;
  popular: boolean;
  active: boolean;
  sortOrder: number;
};

export type BeatWithLicenses = Beat & { licenses: BeatLicense[] };

export type Video = {
  id: string;
  title: string;
  description: string | null;
  source: string;
  url: string | null;
  fileUrl: string | null;
  thumbnail: string | null;
  featured: boolean;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Order = {
  id: string;
  reference: string;
  userId: string | null;
  email: string;
  name: string;
  phone: string | null;
  country: string | null;
  note: string | null;
  subtotal: number;
  total: number;
  currency: string;
  status: string;
  paymentMethod: string;
  paymentRef: string | null;
  payerNote: string | null;
  paidAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderItem = {
  id: string;
  orderId: string;
  beatId: string | null;
  licenseId: string | null;
  title: string;
  tier: string;
  licenseName: string;
  price: number;
  currency: string;
  fileFormat: string | null;
};

export type OrderWithItems = Order & {
  items: OrderItem[];
  downloads?: Download[];
};

export type Download = {
  id: string;
  token: string;
  orderId: string;
  orderItemId: string;
  userId: string | null;
  fileUrl: string | null;
  licenseUrl: string | null;
  downloads: number;
  maxDownloads: number;
  expiresAt: Date;
  lastDownloadAt: Date | null;
  createdAt: Date;
};

export type Message = {
  id: string;
  userId: string | null;
  orderId: string | null;
  name: string;
  email: string;
  subject: string;
  body: string;
  topic: string;
  direction: string;
  status: string;
  createdAt: Date;
};

export type EmailLog = {
  id: string;
  to: string;
  from: string | null;
  subject: string;
  type: string;
  html: string | null;
  text: string | null;
  status: string;
  providerId: string | null;
  error: string | null;
  orderId: string | null;
  createdAt: Date;
};

export type StudioService = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  pricePerHour: number;
  minHours: number;
  maxHours: number;
  active: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type Booking = {
  id: string;
  reference: string;
  serviceId: string | null;
  serviceName: string;
  userId: string | null;
  email: string;
  name: string;
  phone: string | null;
  /** Session date as YYYY-MM-DD (studio's local time). */
  date: string;
  /** First hour of the session, 24h clock (e.g. 14 = 2 PM). */
  startHour: number;
  hours: number;
  endHour: number;
  pricePerHour: number;
  sessionTotal: number;
  depositPercent: number;
  depositAmount: number;
  serviceFeePercent: number;
  serviceFeeAmount: number;
  /** What the artist pays online now: deposit + service fee. */
  amountDue: number;
  /** Remaining balance, settled at the studio. */
  balanceAmount: number;
  currency: string;
  notes: string | null;
  status: string;
  paymentMethod: string;
  paymentRef: string | null;
  payerNote: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
