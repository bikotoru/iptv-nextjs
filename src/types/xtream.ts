export interface XtreamCategory {
  category_id: string;
  category_name: string;
  parent_id: string;
  direct_source?: string;
}

export interface XtreamStream {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon?: string;
  epg_channel_id?: string;
  category_id: string;
  custom_sid?: string;
  tv_archive_duration?: number;
  added?: string;
}

export interface ChannelStream {
  id: number;
  name: string;
  streamType: string;
  streamIcon: string | null;
  streamUrl: string;
  added?: string;
  groupTitle?: string;
}

export interface ChannelCategory {
  id: string;
  name: string;
  order: number;
  parentId: string;
  streams: ChannelStream[];
}

// Connection types
export type ConnectionType = "xtream" | "m3u8";

export interface XtreamCredentials {
  type: "xtream";
  apiBase: string;
  username: string;
  password: string;
  sessionCookie?: string;
  userAgent?: string;
  streamReferer?: string;
}

export interface M3U8Connection {
  type: "m3u8";
  url?: string;
  content?: string;
  userAgent?: string;
  streamReferer?: string;
}

export type ConnectionCredentials = XtreamCredentials | M3U8Connection;

export interface IPTVConnection {
  id: string;
  name: string;
  credentials: ConnectionCredentials;
  createdAt: number;
  updatedAt: number;
}

// M3U8 Parser types
export interface M3U8Entry {
  url: string;
  name: string;
  logo?: string;
  groupTitle?: string;
  tvgId?: string;
  tvgName?: string;
  duration?: number;
}
