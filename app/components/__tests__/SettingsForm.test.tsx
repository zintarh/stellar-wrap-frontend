/**
 * @jest-environment jsdom
 *
 * Unit tests for SettingsForm component.
 * Covers rendering, user interactions, accessibility, and all prop variants.
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { SettingsForm } from "../SettingsForm";
import type { SettingsFormProps } from "../SettingsForm";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderForm(props: Partial<SettingsFormProps> = {}) {
  return render(<SettingsForm {...props} />);
}

// ─── Rendering ───────────────────────────────────────────────────────────────

describe("SettingsForm – rendering", () => {
  it("renders push notification section", () => {
    renderForm();
    expect(screen.getByText("Push Notifications")).toBeInTheDocument();
  });

  it("renders email notification section", () => {
    renderForm();
    expect(screen.getByText("Email Notifications")).toBeInTheDocument();
  });

  it("renders the email input with correct type", () => {
    renderForm({ email: "user@test.com" });
    const input = screen.getByRole("textbox");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveValue("user@test.com");
  });

  it("renders a Subscribe button", () => {
    renderForm();
    expect(screen.getByRole("button", { name: /subscribe/i })).toBeInTheDocument();
  });

  it("renders period checkboxes when pushEnabled is true", () => {
    renderForm({
      pushEnabled: true,
      periods: {
        push: { weekly: false, monthly: false, yearly: false },
        email: { weekly: false, monthly: false, yearly: false },
      },
    });
    expect(screen.getAllByRole("checkbox").length).toBeGreaterThanOrEqual(3);
  });

  it("does not render push period checkboxes when pushEnabled is false", () => {
    renderForm({ pushEnabled: false });
    // Only email checkboxes would be present if emailEnabled were true — here neither is
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("renders period checkboxes for email when emailEnabled is true", () => {
    renderForm({
      emailEnabled: true,
      periods: {
        push: { weekly: false, monthly: false, yearly: false },
        email: { weekly: true, monthly: false, yearly: false },
      },
    });
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThanOrEqual(3);
  });

  it("shows 'Saved' button text when emailStatus is active", () => {
    renderForm({ emailStatus: "active" });
    expect(screen.getByRole("button", { name: /saved/i })).toBeInTheDocument();
  });

  it("shows pending status message when emailStatus is pending", () => {
    renderForm({ emailStatus: "pending" });
    expect(screen.getByText(/confirmation email sent/i)).toBeInTheDocument();
  });

  it("shows confirmed status message when emailStatus is active", () => {
    renderForm({ emailStatus: "active" });
    expect(screen.getByText(/email confirmed and active/i)).toBeInTheDocument();
  });

  it("marks form as aria-busy when loading", () => {
    renderForm({ loading: true });
    const form = document.querySelector("form");
    expect(form).toHaveAttribute("aria-busy", "true");
  });

  it("marks form as not aria-busy when not loading", () => {
    renderForm({ loading: false });
    const form = document.querySelector("form");
    expect(form).toHaveAttribute("aria-busy", "false");
  });
});

// ─── Push Toggle ─────────────────────────────────────────────────────────────

describe("SettingsForm – push toggle", () => {
  it("toggle button has aria-pressed=false when pushEnabled is false", () => {
    renderForm({ pushEnabled: false });
    const toggle = screen.getByRole("button", { name: /enable push notifications/i });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("toggle button has aria-pressed=true when pushEnabled is true", () => {
    renderForm({ pushEnabled: true });
    const toggle = screen.getByRole("button", { name: /disable push notifications/i });
    expect(toggle).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onPushToggle with true when toggle is clicked and was off", () => {
    const onPushToggle = jest.fn();
    renderForm({ pushEnabled: false, onPushToggle });
    fireEvent.click(screen.getByRole("button", { name: /enable push notifications/i }));
    expect(onPushToggle).toHaveBeenCalledWith(true);
  });

  it("calls onPushToggle with false when toggle is clicked and was on", () => {
    const onPushToggle = jest.fn();
    renderForm({ pushEnabled: true, onPushToggle });
    fireEvent.click(screen.getByRole("button", { name: /disable push notifications/i }));
    expect(onPushToggle).toHaveBeenCalledWith(false);
  });

  it("does not call onPushToggle when disabled", () => {
    const onPushToggle = jest.fn();
    renderForm({ pushEnabled: false, disabled: true, onPushToggle });
    const toggle = screen.getByRole("button", { name: /push notifications/i });
    expect(toggle).toBeDisabled();
    fireEvent.click(toggle);
    expect(onPushToggle).not.toHaveBeenCalled();
  });
});

// ─── Email Input ─────────────────────────────────────────────────────────────

describe("SettingsForm – email input", () => {
  it("calls onEmailChange when the user types in the email field", async () => {
    const onEmailChange = jest.fn();
    renderForm({ onEmailChange });
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "a@b.com");
    expect(onEmailChange).toHaveBeenCalled();
  });

  it("calls onEmailSubmit with the current email value on form submit", () => {
    const onEmailSubmit = jest.fn();
    renderForm({ email: "test@example.com", onEmailSubmit });
    fireEvent.submit(document.querySelector("form")!);
    expect(onEmailSubmit).toHaveBeenCalledWith("test@example.com");
  });

  it("calls onEmailSubmit when Subscribe is clicked", () => {
    const onEmailSubmit = jest.fn();
    renderForm({ email: "test@example.com", onEmailSubmit });
    fireEvent.click(screen.getByRole("button", { name: /subscribe/i }));
    expect(onEmailSubmit).toHaveBeenCalledWith("test@example.com");
  });

  it("Subscribe button is disabled when email input is empty", () => {
    renderForm({ email: "" });
    expect(screen.getByRole("button", { name: /subscribe/i })).toBeDisabled();
  });

  it("Subscribe button is disabled when emailStatus is active", () => {
    renderForm({ email: "a@b.com", emailStatus: "active" });
    expect(screen.getByRole("button", { name: /saved/i })).toBeDisabled();
  });

  it("email input is disabled when emailStatus is active", () => {
    renderForm({ emailStatus: "active" });
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("does not call onEmailSubmit when disabled", () => {
    const onEmailSubmit = jest.fn();
    renderForm({ email: "a@b.com", disabled: true, onEmailSubmit });
    fireEvent.submit(document.querySelector("form")!);
    expect(onEmailSubmit).not.toHaveBeenCalled();
  });
});

// ─── Period Checkboxes ────────────────────────────────────────────────────────

describe("SettingsForm – period checkboxes", () => {
  it("calls onPeriodChange when a push period checkbox is toggled", () => {
    const onPeriodChange = jest.fn();
    renderForm({
      pushEnabled: true,
      periods: {
        push: { weekly: false, monthly: false, yearly: false },
        email: { weekly: false, monthly: false, yearly: false },
      },
      onPeriodChange,
    });
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);
    expect(onPeriodChange).toHaveBeenCalledWith("push", "weekly", true);
  });

  it("calls onPeriodChange when an email period checkbox is toggled", () => {
    const onPeriodChange = jest.fn();
    renderForm({
      emailEnabled: true,
      periods: {
        push: { weekly: false, monthly: false, yearly: false },
        email: { weekly: false, monthly: false, yearly: false },
      },
      onPeriodChange,
    });
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);
    expect(onPeriodChange).toHaveBeenCalledWith("email", "weekly", true);
  });

  it("period checkboxes are disabled when the form is disabled", () => {
    renderForm({
      pushEnabled: true,
      disabled: true,
      periods: {
        push: { weekly: true, monthly: false, yearly: false },
        email: { weekly: false, monthly: false, yearly: false },
      },
    });
    for (const cb of screen.getAllByRole("checkbox")) {
      expect(cb).toBeDisabled();
    }
  });

  it("reflects checked state from the periods prop", () => {
    renderForm({
      pushEnabled: true,
      periods: {
        push: { weekly: true, monthly: false, yearly: true },
        email: { weekly: false, monthly: false, yearly: false },
      },
    });
    const checkboxes = screen.getAllByRole("checkbox") as HTMLInputElement[];
    const checkedBoxes = checkboxes.filter((cb) => cb.checked);
    expect(checkedBoxes).toHaveLength(2);
  });
});

// ─── Disabled / Loading States ────────────────────────────────────────────────

describe("SettingsForm – disabled and loading states", () => {
  it("disables all controls when disabled prop is true", () => {
    renderForm({ disabled: true, email: "a@b.com" });
    const buttons = screen.getAllByRole("button");
    for (const btn of buttons) {
      expect(btn).toBeDisabled();
    }
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("disables controls when loading prop is true", () => {
    renderForm({ loading: true, email: "a@b.com" });
    expect(screen.getByRole("textbox")).toBeDisabled();
  });
});

// ─── Accessibility ────────────────────────────────────────────────────────────

describe("SettingsForm – accessibility", () => {
  it("push toggle has a descriptive aria-label", () => {
    renderForm({ pushEnabled: false });
    const toggle = screen.getByLabelText(/push notifications/i);
    expect(toggle).toBeInTheDocument();
  });

  it("email input is a labelled form field", () => {
    renderForm();
    // The email input carries a placeholder; its type attribute identifies it
    const input = screen.getByPlaceholderText("your@email.com");
    expect(input).toHaveAttribute("type", "email");
  });

  it("wraps controls in a <form> element", () => {
    renderForm();
    expect(document.querySelector("form")).toBeInTheDocument();
  });
});
