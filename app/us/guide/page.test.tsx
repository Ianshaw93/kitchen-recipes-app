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

    expect(screen.getByText("From our therapist's Speaker-Listener handout")).toBeInTheDocument();
    expect(screen.getByText(/^Do$/)).toBeInTheDocument();
    expect(screen.getByText(/^Don't$/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /switch roles/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /start round 2/i })).not.toBeInTheDocument();

    const step = screen.getByRole("button", { name: /honestly share your feelings and beliefs/i });
    await user.click(step);
    expect(step).toHaveAttribute("aria-pressed", "true");
    expect(window.localStorage.getItem("kusina:checked:steps:us-guide-listening")).toContain(
      "speaker-honest",
    );
    await user.click(screen.getByRole("button", { name: /reset/i }));
    expect(step).toHaveAttribute("aria-pressed", "false");
  });
});