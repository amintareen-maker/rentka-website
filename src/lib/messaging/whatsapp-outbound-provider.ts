export type WhatsAppTemplateComponent={
  type:string;
  sub_type?:string;
  index?:string;
  parameters?:Array<Record<string,unknown>>;
};

export type WhatsAppTextMessage={
  to:string;
  body:string;
  previewUrl?:boolean;
};

export type WhatsAppTemplateMessage={
  to:string;
  name:string;
  languageCode:string;
  components?:WhatsAppTemplateComponent[];
};

export type WhatsAppSendResult={
  provider:"dualhook";
  messageId:string;
};

export interface WhatsAppOutboundProvider{
  sendText(message:WhatsAppTextMessage):Promise<WhatsAppSendResult>;
  sendTemplate(message:WhatsAppTemplateMessage):Promise<WhatsAppSendResult>;
}
