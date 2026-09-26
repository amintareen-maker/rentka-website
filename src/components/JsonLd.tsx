type JsonLdProps = {
  dangerouslySetInnerHTML: { __html: string };
  id?: string;
  type?: "application/ld+json";
};

export default function JsonLd({ dangerouslySetInnerHTML, id }: JsonLdProps) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: dangerouslySetInnerHTML.__html.replaceAll("<", "\\u003c"),
      }}
    />
  );
}
