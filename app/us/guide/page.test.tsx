import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import GuidePage, { metadata } from "./page";

describe("/us/guide", () => {
  it("asks crawlers not to index or follow", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("renders the solo guide from local content and does not call the relationship API", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<GuidePage />);

    expect(screen.getByRole("heading", { name: /guide/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /together/i })).toHaveAttribute("href", "/us");
    expect(screen.getByRole("heading", { name: /active listening/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /four horsemen/i })).toBeInTheDocument();
    expect(screen.getByText(/name the pattern, not the person/i)).toBeInTheDocument();
    expect(screen.getByText(/What might Ian have been feeling/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /ask deepseek/i })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    const step = screen.getByRole("button", { name: /pick one topic/i });
    await user.click(step);
    expect(step).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: /reset/i }));
    expect(step).toHaveAttribute("aria-pressed", "false");
  });
});