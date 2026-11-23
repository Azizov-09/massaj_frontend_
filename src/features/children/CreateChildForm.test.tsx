import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { CreateChildForm } from "./CreateChildForm";
import { useStore } from "@/store";
import { child, owner, parent } from "@/test/clinicFixtures";
const original = useStore.getState().createChild;
beforeEach(() => useStore.setState({ currentUser: owner, parents: [parent] }));
afterEach(() => useStore.setState({ createChild: original }));
it("creates a child without requiring a service or a specialist and returns the saved child", async () => {
  const create = vi.fn().mockResolvedValue(child),
    done = vi.fn();
  useStore.setState({ createChild: create });
  render(<CreateChildForm onSuccess={done} onCancel={vi.fn()} />);
  fireEvent.change(screen.getByLabelText(/To‘liq ism/), {
    target: { value: child.fullName },
  });
  fireEvent.change(screen.getByLabelText(/Tug‘ilgan sana/), {
    target: { value: child.dateOfBirth },
  });
  fireEvent.change(screen.getByRole("combobox", { name: "Ota-ona" }), {
    target: { value: parent.id },
  });
  fireEvent.click(screen.getByRole("button", { name: "Bolani saqlash" }));
  await waitFor(() => expect(done).toHaveBeenCalledWith(child));
  expect(create).toHaveBeenCalledWith(
    expect.objectContaining({ fullName: child.fullName, parentId: parent.id }),
  );
  expect(screen.queryByText("Mutaxassis")).not.toBeInTheDocument();
});
it("retains entered information and shows an error when the backend rejects creation", async () => {
  useStore.setState({
    createChild: vi.fn().mockRejectedValue(new Error("Server javob bermadi")),
  });
  render(
    <CreateChildForm
      onSuccess={vi.fn()}
      onCancel={vi.fn()}
      defaultParentId={parent.id}
    />,
  );
  fireEvent.change(screen.getByLabelText(/To‘liq ism/), {
    target: { value: child.fullName },
  });
  fireEvent.change(screen.getByLabelText(/Tug‘ilgan sana/), {
    target: { value: child.dateOfBirth },
  });
  fireEvent.click(screen.getByRole("button", { name: "Bolani saqlash" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Server javob bermadi",
  );
  expect(screen.getByLabelText(/To‘liq ism/)).toHaveValue(child.fullName);
});
