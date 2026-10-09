import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";
import GuideHorsemenPage, { metadata as horsemenMetadata } from "./horsemen/page";
import GuideLayout, { metadata as layoutMetadata } from "./layout";
import GuideListeningPage, { metadata as listeningMetadata } from "./listening/page";
import GuidePage, { metadata } from "./page";
import GuideReflectPage, { metadata as reflectMetadata } from "./reflect/page";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/us/guide"),
}));

function renderRoute(path: string, Page: ComponentType) {
  vi.mocked(usePathname).mockReturnValue(path);
  return render(
    <GuideLayout>
      <Page />
    </GuideLayout>,
  );
}

const ALL_REGIONS = [/our standards/i, /active listening/i, /four horsemen/i, /step outside/i];

function expectOnlyRegions(...visible: RegExp[]) {
  for (const name of ALL_REGIONS) {
    if (visible.includes(name)) {
      expect(screen.getByRole("region", { name })).toBeInTheDocument();
    } else {
      expect(screen.queryByRole("region", { name })).not.toBeInTheDocument();
    }
  }
}

describe("/us/guide routes", () => {
  it("asks crawlers not to index or follow any guide section", () => {
    for (const meta of [layoutMetadata, metadata, listeningMetadata, horsemenMetadata, reflectMetadata]) {
      expect(meta.robots).toEqual({ index: false, follow: false });
    }
  });

  it("opens on our standards, read-only, with guide tabs and a way back to Together", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderRoute("/us/guide", GuidePage);

    const standards = screen.getByRole("region", { name: /our standards/i });
    expect(screen.getByRole("main").firstElementChild).toBe(standards);
    expect(within(standards).queryByRole("button")).not.toBeInTheDocument();
    expect(within(standards).getByText(/Consistent appreciation/)).toBeInTheDocument();
    expect(
      within(standards).getByText(/Take ownership of any toxic behaviour that arises/),
    ).toBeInTheDocument();
    expect(within(standards).getByText(/put yourself in my shoes/)).toBeInTheDocument();
    expectOnlyRegions(/our standards/i);

    expect(screen.getByRole("heading", { level: 1, name: /guide/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /together/i })).toHaveAttribute("href", "/us");
    const tabs = screen.getByRole("navigation", { name: /guide sections/i });
    expect(within(tabs).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual([
      "/us/guide",
      "/us/guide/listening",
      "/us/guide/horsemen",
      "/us/guide/reflect",
    ]);
    expect(screen.getByText(/nothing you write is saved on the server/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps the solo listening checklist on this phone at /us/guide/listening", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderRoute("/us/guide/listening", GuideListeningPage);

    expectOnlyRegions(/active listening/i);
    expect(screen.getByText("From our therapist's Speaker-Listener handout")).toBeInTheDocument();
    expect(screen.getByText(/Raising something\?/)).toBeInTheDocument();
    expect(screen.getByText(/^Do$/)).toBeInTheDocument();
    expect(screen.getByText(/^Don't$/)).toBeInTheDocument();
    expect(screen.getByText(/^If relevant$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /take accountability/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /plan to stop it happening again/i })).toBeInTheDocument();
    expect(screen.getByText("Write: what I'll do, by when, and when we'll check in")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /switch roles/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /minimise their feelings/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^action$/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /save takeaway/i })).not.toBeInTheDocument();

    const step = screen.getByRole("button", { name: /postpone your own agenda/i });
    await user.click(step);
    expect(step).toHaveAttribute("aria-pressed", "true");
    expect(window.localStorage.getItem("kusina:checked:steps:us-guide-listening")).toContain(
      "prepare-agenda",
    );
    await user.click(screen.getByRole("button", { name: /reset/i }));
    expect(step).toHaveAttribute("aria-pressed", "false");
    await user.click(screen.getByRole("button", { name: /plan to stop it happening again/i }));
    expect(screen.queryByLabelText(/^action$/i)).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("frames the horsemen for journalling at /us/guide/horsemen", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderRoute("/us/guide/horsemen", GuideHorsemenPage);

    expectOnlyRegions(/four horsemen/i);
    expect(screen.getByText(/name the pattern, not the person/i)).toBeInTheDocument();
    expect(screen.getByText(/spot the pattern in your own writing/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("collects the empathy prompts and the Ask DeepSeek placeholder at /us/guide/reflect", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderRoute("/us/guide/reflect", GuideReflectPage);

    expectOnlyRegions(/step outside/i);
    expect(screen.getByText(/What might Ian have been feeling/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /ask deepseek/i })).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /next/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /previous.*four horsemen/i })).toHaveAttribute(
      "href",
      "/us/guide/horsemen",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
