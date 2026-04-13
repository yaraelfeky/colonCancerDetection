import React, { useMemo, useState } from "react";
import Navbar from "../../components/Layout/Navbar";
import Footer from "../../components/Layout/Footer";
import Container from "../../components/Layout/Container";

interface Patient {
  id: string;
  name: string;
  phoneNumber: string;
}

type AppointmentStatus = "Confirmed" | "Pending" | "Cancelled";

interface Appointment {
  id: string;
  patient: Patient;
  date: string;
  time: string;
  serviceType: string;
  notes?: string;
  status: AppointmentStatus;
}

interface AppointmentFormState {
  patientName: string;
  phoneNumber: string;
  date: string;
  time: string;
  serviceType: string;
  notes: string;
  status: AppointmentStatus;
}

const SERVICE_TYPES = [
  "Initial Consultation",
  "Follow-up Visit",
  "Colonoscopy Review",
  "Lab Results Discussion",
  "Treatment Planning",
];

const WORKING_HOURS_LABEL = "9:00 AM - 5:00 PM";

const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let hour = 9; hour < 17; hour++) {
    slots.push(`${String(hour).padStart(2, "0")}:00`);
    slots.push(`${String(hour).padStart(2, "0")}:30`);
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

const toDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatCalendarMonth = (date: Date): string =>
  date.toLocaleDateString(undefined, { month: "long", year: "numeric" });

const formatTimeDisplay = (time24: string): string => {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
};

const initialAppointments = (today: string): Appointment[] => [
  {
    id: "apt-1",
    patient: { id: "pt-1", name: "Hagar Ahmed", phoneNumber: "01011111147" },
    date: today,
    time: "09:30",
    serviceType: "Initial Consultation",
    notes: "Mild abdominal pain, review prior scans.",
    status: "Confirmed",
  },
  {
    id: "apt-2",
    patient: { id: "pt-2", name: "Omar Adel", phoneNumber: "01022223333" },
    date: today,
    time: "11:00",
    serviceType: "Follow-up Visit",
    notes: "",
    status: "Pending",
  },
  {
    id: "apt-3",
    patient: { id: "pt-3", name: "Sara Youssef", phoneNumber: "01033334444" },
    date: toDateInputValue(new Date(Date.now() + 86400000)),
    time: "14:00",
    serviceType: "Colonoscopy Review",
    notes: "Bring pathology report.",
    status: "Confirmed",
  },
];

const DoctorAppointmentDashboardPage: React.FC = () => {
  const today = useMemo(() => toDateInputValue(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>(
    initialAppointments(today)
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(
    null
  );
  const [showSuccess, setShowSuccess] = useState(false);

  const [form, setForm] = useState<AppointmentFormState>({
    patientName: "",
    phoneNumber: "",
    date: selectedDate,
    time: TIME_SLOTS[0],
    serviceType: SERVICE_TYPES[0],
    notes: "",
    status: "Confirmed",
  });

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof AppointmentFormState, string>>>({});

  const selectedDayAppointments = useMemo(
    () =>
      appointments
        .filter((a) => a.date === selectedDate)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [appointments, selectedDate]
  );

  const bookedTimesForSelectedDay = useMemo(
    () => new Set(selectedDayAppointments.filter((a) => a.status !== "Cancelled").map((a) => a.time)),
    [selectedDayAppointments]
  );

  const appointmentCountByDate = useMemo(() => {
    const map = new Map<string, number>();
    appointments.forEach((a) => {
      if (a.status !== "Cancelled") {
        map.set(a.date, (map.get(a.date) ?? 0) + 1);
      }
    });
    return map;
  }, [appointments]);

  const calendarCells = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: Array<{ date: Date; inCurrentMonth: boolean }> = [];

    for (let i = 0; i < startWeekDay; i++) {
      const d = new Date(year, month, i - startWeekDay + 1);
      cells.push({ date: d, inCurrentMonth: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ date: new Date(year, month, day), inCurrentMonth: true });
    }

    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].date;
      const next = new Date(last);
      next.setDate(last.getDate() + 1);
      cells.push({ date: next, inCurrentMonth: false });
    }

    return cells;
  }, [calendarMonth]);

  const openCreateModal = () => {
    setEditingAppointmentId(null);
    setForm({
      patientName: "",
      phoneNumber: "",
      date: selectedDate,
      time: TIME_SLOTS[0],
      serviceType: SERVICE_TYPES[0],
      notes: "",
      status: "Confirmed",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (appointment: Appointment) => {
    setEditingAppointmentId(appointment.id);
    setForm({
      patientName: appointment.patient.name,
      phoneNumber: appointment.patient.phoneNumber,
      date: appointment.date,
      time: appointment.time,
      serviceType: appointment.serviceType,
      notes: appointment.notes ?? "",
      status: appointment.status,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof AppointmentFormState, string>> = {};
    if (!form.patientName.trim()) errors.patientName = "Patient name is required.";
    if (!form.phoneNumber.trim()) errors.phoneNumber = "Phone number is required.";
    if (!form.date) errors.date = "Date is required.";
    if (!form.time) errors.time = "Time is required.";
    if (!form.serviceType.trim()) errors.serviceType = "Service type is required.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (editingAppointmentId) {
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === editingAppointmentId
            ? {
                ...a,
                patient: {
                  ...a.patient,
                  name: form.patientName.trim(),
                  phoneNumber: form.phoneNumber.trim(),
                },
                date: form.date,
                time: form.time,
                serviceType: form.serviceType,
                notes: form.notes.trim(),
                status: form.status,
              }
            : a
        )
      );
    } else {
      const newId = `apt-${Date.now()}`;
      const newPatientId = `pt-${Date.now()}`;
      const newAppointment: Appointment = {
        id: newId,
        patient: {
          id: newPatientId,
          name: form.patientName.trim(),
          phoneNumber: form.phoneNumber.trim(),
        },
        date: form.date,
        time: form.time,
        serviceType: form.serviceType,
        notes: form.notes.trim(),
        status: form.status,
      };
      setAppointments((prev) => [...prev, newAppointment]);
    }

    setSelectedDate(form.date);
    setIsModalOpen(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2200);
  };

  const handleDeleteAppointment = (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  };

  const updateStatus = (id: string, status: AppointmentStatus) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  };

  const prevMonth = () => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const statusBadgeClasses: Record<AppointmentStatus, string> = {
    Confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Pending: "bg-amber-100 text-amber-700 border-amber-200",
    Cancelled: "bg-rose-100 text-rose-700 border-rose-200",
  };

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "#002570" }}>
      <Navbar />
      <main className="flex-1" style={{ background: "#F5F7FA" }}>
        <section className="py-8 md:py-10">
          <Container>
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-800 md:text-3xl">
                  Appointment Management
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Manage patient appointments, schedules, and visit statuses.
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  background: "linear-gradient(135deg, #1E88E5, #26A69A)",
                  boxShadow: "0 8px 20px rgba(30,136,229,0.28)",
                }}
              >
                + Add Appointment
              </button>
            </div>

            {showSuccess && (
              <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                Appointment saved successfully.
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="space-y-6 xl:col-span-1">
                <div
                  className="rounded-2xl bg-white p-5"
                  style={{ boxShadow: "0 6px 24px rgba(0,0,0,0.06)" }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <button
                      onClick={prevMonth}
                      className="rounded-lg bg-slate-100 px-2 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                      type="button"
                    >
                      ←
                    </button>
                    <h2 className="text-base font-bold text-slate-800">
                      {formatCalendarMonth(calendarMonth)}
                    </h2>
                    <button
                      onClick={nextMonth}
                      className="rounded-lg bg-slate-100 px-2 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                      type="button"
                    >
                      →
                    </button>
                  </div>

                  <div className="mb-2 grid grid-cols-7 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                      <span key={d} className="py-1">
                        {d}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {calendarCells.map(({ date, inCurrentMonth }) => {
                      const dateValue = toDateInputValue(date);
                      const isSelected = dateValue === selectedDate;
                      const count = appointmentCountByDate.get(dateValue) ?? 0;

                      return (
                        <button
                          key={dateValue}
                          type="button"
                          onClick={() => setSelectedDate(dateValue)}
                          className={`relative rounded-lg px-2 py-2 text-sm transition ${
                            isSelected
                              ? "font-bold text-white"
                              : inCurrentMonth
                              ? "text-slate-700 hover:bg-slate-100"
                              : "text-slate-300"
                          }`}
                          style={
                            isSelected
                              ? {
                                  background:
                                    "linear-gradient(135deg, #1E88E5, #26A69A)",
                                }
                              : undefined
                          }
                        >
                          {date.getDate()}
                          {count > 0 && (
                            <span
                              className={`absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full ${
                                isSelected ? "bg-white" : "bg-[#26A69A]"
                              }`}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div
                  className="rounded-2xl bg-white p-5"
                  style={{ boxShadow: "0 6px 24px rgba(0,0,0,0.06)" }}
                >
                  <h3 className="text-base font-bold text-slate-800">Visit Hours</h3>
                  <p className="mt-1 text-sm text-slate-500">{WORKING_HOURS_LABEL}</p>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {TIME_SLOTS.map((slot) => {
                      const booked = bookedTimesForSelectedDay.has(slot);
                      return (
                        <div
                          key={slot}
                          className={`rounded-lg border px-2 py-2 text-center text-xs font-semibold ${
                            booked
                              ? "border-rose-200 bg-rose-50 text-rose-600"
                              : "border-emerald-200 bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {formatTimeDisplay(slot)} · {booked ? "Booked" : "Available"}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="xl:col-span-2">
                <div
                  className="rounded-2xl bg-white p-5 md:p-6"
                  style={{ boxShadow: "0 6px 24px rgba(0,0,0,0.06)" }}
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">
                        Appointments - {selectedDate}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {selectedDayAppointments.length} appointment(s) for selected day
                      </p>
                    </div>
                  </div>

                  {selectedDayAppointments.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                      No appointments for this day.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedDayAppointments.map((appointment) => (
                        <article
                          key={appointment.id}
                          className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md"
                        >
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <h4 className="text-base font-bold text-slate-800">
                              {appointment.patient.name}
                            </h4>
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                statusBadgeClasses[appointment.status]
                              }`}
                            >
                              {appointment.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-2 text-sm text-slate-600 md:grid-cols-2">
                            <p>
                              <span className="font-semibold text-slate-700">Phone:</span>{" "}
                              {appointment.patient.phoneNumber}
                            </p>
                            <p>
                              <span className="font-semibold text-slate-700">Time:</span>{" "}
                              {formatTimeDisplay(appointment.time)}
                            </p>
                            <p>
                              <span className="font-semibold text-slate-700">Service:</span>{" "}
                              {appointment.serviceType}
                            </p>
                            <p>
                              <span className="font-semibold text-slate-700">Date:</span>{" "}
                              {appointment.date}
                            </p>
                          </div>

                          {appointment.notes && (
                            <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                              <span className="font-semibold text-slate-700">Notes:</span>{" "}
                              {appointment.notes}
                            </p>
                          )}

                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(appointment)}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                updateStatus(
                                  appointment.id,
                                  appointment.status === "Confirmed"
                                    ? "Pending"
                                    : "Confirmed"
                                )
                              }
                              className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                            >
                              Toggle Confirmed/Pending
                            </button>

                            <button
                              type="button"
                              onClick={() => updateStatus(appointment.id, "Cancelled")}
                              className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                            >
                              Cancel
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteAppointment(appointment.id)}
                              className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                            >
                              Delete
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Container>
        </section>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 md:items-center">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">
                {editingAppointmentId ? "Edit Appointment" : "Add Appointment"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitAppointment} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Patient Name
                  </label>
                  <input
                    type="text"
                    value={form.patientName}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, patientName: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-[#1E88E5]/20 transition focus:ring-2"
                  />
                  {formErrors.patientName && (
                    <p className="mt-1 text-xs text-rose-600">{formErrors.patientName}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={form.phoneNumber}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, phoneNumber: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-[#1E88E5]/20 transition focus:ring-2"
                  />
                  {formErrors.phoneNumber && (
                    <p className="mt-1 text-xs text-rose-600">{formErrors.phoneNumber}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Date
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-[#1E88E5]/20 transition focus:ring-2"
                  />
                  {formErrors.date && (
                    <p className="mt-1 text-xs text-rose-600">{formErrors.date}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Time
                  </label>
                  <select
                    value={form.time}
                    onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-[#1E88E5]/20 transition focus:ring-2"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {formatTimeDisplay(slot)}
                      </option>
                    ))}
                  </select>
                  {formErrors.time && (
                    <p className="mt-1 text-xs text-rose-600">{formErrors.time}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Service Type
                  </label>
                  <select
                    value={form.serviceType}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, serviceType: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-[#1E88E5]/20 transition focus:ring-2"
                  >
                    {SERVICE_TYPES.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                  {formErrors.serviceType && (
                    <p className="mt-1 text-xs text-rose-600">{formErrors.serviceType}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        status: e.target.value as AppointmentStatus,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-[#1E88E5]/20 transition focus:ring-2"
                  >
                    <option value="Confirmed">Confirmed</option>
                    <option value="Pending">Pending</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-[#1E88E5]/20 transition focus:ring-2"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
                  style={{ background: "linear-gradient(135deg, #1E88E5, #26A69A)" }}
                >
                  {editingAppointmentId ? "Save Changes" : "Create Appointment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default DoctorAppointmentDashboardPage;
