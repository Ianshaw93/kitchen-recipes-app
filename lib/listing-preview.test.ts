import { describe, expect, it } from "vitest";
import { extractCommercePreviewImage, extractListingPreviewImage } from "./listing-preview";

describe("extractListingPreviewImage", () => {
  it("reads og:image content regardless of attribute order", () => {
    const html = `
      <html><head>
        <meta content="https://cdn.example/photos/hero.jpg" property="og:image">
      </head></html>
    `;

    expect(extractListingPreviewImage(html)).toBe("https://cdn.example/photos/hero.jpg");
  });

  it("prefers og:image over twitter:image", () => {
    const html = `
      <meta name="twitter:image" content="https://cdn.example/twitter.jpg">
      <meta property='og:image' content='https://cdn.example/og.jpg' />
    `;

    expect(extractListingPreviewImage(html)).toBe("https://cdn.example/og.jpg");
  });

  it("falls back to twitter:image and twitter:image:src", () => {
    expect(
      extractListingPreviewImage(`<meta name="twitter:image" content="https://cdn.example/tw.jpg">`),
    ).toBe("https://cdn.example/tw.jpg");
    expect(
      extractListingPreviewImage(
        `<meta name="twitter:image:src" content="https://cdn.example/src.jpg">`,
      ),
    ).toBe("https://cdn.example/src.jpg");
  });

  it("resolves a relative preview against the listing page", () => {
    const html = `<meta property="og:image" content="/photos/house.jpg">`;
    expect(extractListingPreviewImage(html, "https://example.com/buy/1")).toBe(
      "https://example.com/photos/house.jpg",
    );
  });

  it("decodes html entities in the image url", () => {
    const html = `<meta property="og:image" content="https://cdn.example/a.jpg?w=1&amp;h=2">`;
    expect(extractListingPreviewImage(html)).toBe("https://cdn.example/a.jpg?w=1&h=2");
  });

  it("uses the first property photo when the page has no share meta", () => {
    const html = `
      <img src="https://mqestateagents.co.uk/build/assets/logo.jpg" alt="logo">
      <img src="https://media2.jupix.co.uk/v3/clients/3280/properties/10760/IMG_10760_27_large.jpg" alt="Property Image">
    `;

    expect(extractListingPreviewImage(html)).toBe(
      "https://media2.jupix.co.uk/v3/clients/3280/properties/10760/IMG_10760_27_large.jpg",
    );
  });

  it("reads an Amazon product image when the page has no share meta", () => {
    const html = `
      <img alt="STATUS radiator" id="landingImage"
        data-a-dynamic-image="{&quot;https://m.media-amazon.com/images/I/71K7iDZkrrL._AC_SY355_.jpg&quot;:[355,355],&quot;https://m.media-amazon.com/images/I/71K7iDZkrrL._AC_SL1500_.jpg&quot;:[1500,1500]}"
        data-old-hires="https://m.media-amazon.com/images/I/71K7iDZkrrL._AC_SL1500_.jpg"
        src="https://m.media-amazon.com/images/I/71K7iDZkrrL._AC_SY300_.jpg">
    `;

    expect(extractCommercePreviewImage(html)).toBe(
      "https://m.media-amazon.com/images/I/71K7iDZkrrL._AC_SL1500_.jpg",
    );
  });

  it("keeps og:image ahead of a retail product image", () => {
    const html = `
      <meta property="og:image" content="https://cdn.example/og.jpg">
      <img id="landingImage" data-old-hires="https://m.media-amazon.com/images/I/other.jpg" src="https://m.media-amazon.com/images/I/small.jpg">
    `;

    expect(extractCommercePreviewImage(html)).toBe("https://cdn.example/og.jpg");
  });

  it("returns null when the page has no preview image", () => {
    expect(extractListingPreviewImage("<html><head><title>Nope</title></head></html>")).toBeNull();
    expect(extractListingPreviewImage(`<meta property="og:image" content="">`)).toBeNull();
    expect(extractListingPreviewImage(`<meta property="og:image" content="javascript:alert(1)">`)).toBeNull();
  });
});
