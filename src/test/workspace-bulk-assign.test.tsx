import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

const fixtures = vi.hoisted(() => ({
  list: vi.fn(),
  assignMany: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  workspacesApi: {
    list: fixtures.list,
    assignMany: fixtures.assignMany,
  },
}));

vi.mock("@/lib/workspace-text", () => ({
  useWorkspaceText: () => ({
    main: "Main",
    error: "Something went wrong.",
    cancel: "Cancel",
    bulkButton: "Workspace",
    bulkTitle: "Organize in a workspace",
    bulkDescription: (n: number) => `Choose for ${n} items.`,
    bulkAdd: "Add to workspace",
    bulkAddDescription: "Keep current assignments.",
    bulkMove: "Move to workspace",
    bulkMoveDescription: "Replace current assignments.",
    bulkChoose: "Choose a workspace",
    bulkApplyAdd: "Add to workspace",
    bulkApplyMove: "Move to workspace",
    bulkSuccess: (n: number) => `Updated ${n} items.`,
  }),
}));

vi.mock("@/components/ui/drawer", async () => {
  const React = await import("react");
  const OpenContext = React.createContext(false);
  return {
    Drawer: ({ open, children }: { open: boolean; children: React.ReactNode }) => (
      <OpenContext.Provider value={open}>{children}</OpenContext.Provider>
    ),
    DrawerContent: ({ children }: { children: React.ReactNode }) => (
      <OpenContext.Consumer>
        {(open) => open ? <div role="dialog">{children}</div> : null}
      </OpenContext.Consumer>
    ),
    DrawerDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
    DrawerFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DrawerHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DrawerTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
    DrawerTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

import { WorkspaceBulkAssignButton } from "@/components/WorkspaceSwitcher";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderBulkAssign() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <WorkspaceBulkAssignButton
        kind="ENTITY"
        selectedIds={["entity-1", "entity-2"]}
        onApplied={vi.fn()}
      />
    </QueryClientProvider>,
  );
}

describe("bulk workspace assignment", () => {
  it("adds all selected items to the chosen workspace", async () => {
    fixtures.list.mockResolvedValue({ data: [{ id: "workspace-1", name: "Research", color: "#123456" }] });
    fixtures.assignMany.mockResolvedValue({ data: { updatedCount: 2 } });
    renderBulkAssign();

    fireEvent.click(screen.getByRole("button", { name: "Workspace" }));
    fireEvent.click(await screen.findByRole("button", { name: "Research" }));
    fireEvent.click(screen.getByRole("button", { name: "Add to workspace" }));

    await waitFor(() => {
      expect(fixtures.assignMany).toHaveBeenCalledWith(
        "ENTITY",
        ["entity-1", "entity-2"],
        "workspace-1",
        "ADD",
      );
    });
  });

  it("uses one drawer to move all selected items to the chosen workspace", async () => {
    fixtures.list.mockResolvedValue({ data: [{ id: "workspace-1", name: "Research", color: "#123456" }] });
    fixtures.assignMany.mockResolvedValue({ data: { updatedCount: 2 } });
    renderBulkAssign();

    fireEvent.click(screen.getByRole("button", { name: "Workspace" }));
    expect(await screen.findByRole("dialog")).toHaveTextContent("Choose for 2 items.");
    fireEvent.click(screen.getByRole("button", { name: /Move to workspace/ }));
    fireEvent.click(screen.getByRole("button", { name: "Research" }));
    fireEvent.click(screen.getByRole("button", { name: "Move to workspace" }));

    await waitFor(() => {
      expect(fixtures.assignMany).toHaveBeenCalledWith(
        "ENTITY",
        ["entity-1", "entity-2"],
        "workspace-1",
        "MOVE",
      );
    });
  });
});
