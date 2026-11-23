import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ProgressPage } from "./ProgressPage";
import { useStore } from "@/store";
import { owner, parent, child, sibling } from "@/test/clinicFixtures";

const firstNote = "Bola harakatlari ancha dadillashdi.";
const secondNote =
  "Yelka sohasi bo'shashtirildi.\n\n[Uy sharoitidagi tavsiya]: Kuniga 10 daqiqa yengil gimnastika.";
const originalCreateProgressNote = useStore.getState().createProgressNote;

function renderPage(childId?: string) {
  return render(
    <MemoryRouter>
      <ProgressPage childId={childId} />
    </MemoryRouter>,
  );
}

describe("ProgressPage supported clinical history", () => {
  beforeEach(() => {
    useStore.setState({
      currentUser: owner,
      children: [child, { ...sibling, parentId: "another-parent" }],
      specialists: [],
      parents: [parent],
      createProgressNote: originalCreateProgressNote,
      progressNotes: [
        {
          id: "note-a",
          childId: child.id,
          specialistId: "author",
          specialistName: "Aziz Karimov",
          note: firstNote,
          date: "2026-02-14",
          createdAt: "2026-02-14T10:00:00Z",
        },
        {
          id: "note-b",
          childId: sibling.id,
          specialistId: "author",
          specialistName: "Aziz Karimov",
          note: secondNote,
          date: "2026-02-12",
          createdAt: "2026-02-12T10:00:00Z",
        },
      ],
      assessments: [
        {
          id: "assessment-a",
          childId: child.id,
          specialistId: "author",
          specialistName: "Aziz Karimov",
          date: "2026-02-10",
          scores: {
            movement: 4,
            coordination: 4,
            flexibility: 4,
            activityTolerance: 4,
            sessionResponse: 4,
          },
          professionalObservation: "Umumiy holat barqaror ijobiy.",
          createdAt: "2026-02-10T10:00:00Z",
        },
      ],
    });
  });
  afterEach(() => vi.restoreAllMocks());

  it("shows saved notes, assessments and authors without empty legacy session controls", () => {
    renderPage();
    expect(
      screen.getByText("Rivojlanish va monitoring (Progress)"),
    ).toBeInTheDocument();
    expect(screen.getByText("Jami qaydlar")).toBeInTheDocument();
    expect(screen.getAllByText("Mutaxassis qaydlari").length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText("Baholash natijalari").length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText(firstNote)).toBeInTheDocument();
    expect(screen.getByText(/Yelka sohasi/)).toBeInTheDocument();
    expect(screen.getAllByText("Aziz Karimov").length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", {
        name: /Seans xulosalari|Tavsiyali qaydlar/i,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(/Mutaxassis bo'yicha filter/i),
    ).not.toBeInTheDocument();
  });

  it("filters actual notes and assessments by event type", () => {
    renderPage();
    fireEvent.click(
      screen.getByRole("button", { name: /Baholash natijalari/i }),
    );
    expect(
      screen.getByText("Umumiy holat barqaror ijobiy."),
    ).toBeInTheDocument();
    expect(screen.queryByText(firstNote)).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /Mutaxassis qaydlari/i }),
    );
    expect(screen.getByText(firstNote)).toBeInTheDocument();
    expect(
      screen.queryByText("Umumiy holat barqaror ijobiy."),
    ).not.toBeInTheDocument();
  });

  it("searches recommendations saved in note text", () => {
    renderPage();
    fireEvent.change(
      screen.getByPlaceholderText(/Bola, mutaxassis yoki xulosa matni/i),
      { target: { value: "gimnastika" } },
    );
    expect(screen.queryByText(firstNote)).not.toBeInTheDocument();
    expect(screen.getByText(/Yelka sohasi/)).toBeInTheDocument();
  });

  it("keeps the table view and note details", () => {
    renderPage();
    fireEvent.click(screen.getByTitle("Jadval ko'rinishi"));
    expect(screen.getByText("Voqea turi")).toBeInTheDocument();
    expect(screen.getByText("Kuzatuv va natijalar")).toBeInTheDocument();
    fireEvent.click(screen.getByText(firstNote));
    expect(screen.getByText("Klinik qayd tafsilotlari")).toBeInTheDocument();
    expect(
      screen.getByText("Klinik xulosa va kuzatuv qaydi"),
    ).toBeInTheDocument();
  });

  it("limits parent history to their children and keeps it read-only", () => {
    useStore.setState({ currentUser: parent });
    renderPage();
    expect(
      screen.getByText("Farzandim rivojlanish tarixi"),
    ).toBeInTheDocument();
    expect(screen.getByText(firstNote)).toBeInTheDocument();
    expect(screen.queryByText(/Yelka sohasi/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Yangi qayd/i }),
    ).not.toBeInTheDocument();
  });

  it("saves the owner specialist linkage and optional advice in the note", async () => {
    const save = vi.fn().mockResolvedValue({ id: "new-note" });
    useStore.setState({ createProgressNote: save });
    renderPage(child.id);
    fireEvent.click(screen.getByRole("button", { name: /Yangi qayd/i }));
    fireEvent.change(
      screen.getByLabelText(/Kuzatuv qaydi yoki muolaja dinamikasi/i),
      { target: { value: " Harakatlar yaxshilandi. " } },
    );
    fireEvent.change(
      screen.getByLabelText(/Ota-ona uchun uy sharoitidagi mashq/i),
      { target: { value: " Yengil mashqlar. " } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Saqlash" }));
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({
          childId: child.id,
          specialistId: owner.specialistId,
          note: "Harakatlar yaxshilandi.\n\n[Uy sharoitidagi tavsiya]: Yengil mashqlar.",
        }),
      ),
    );
  });
});
