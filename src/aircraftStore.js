// In-memory aircraft maintenance store.
// Implements: registration, listing, status transitions, history,
// and tracking views (in-progress, scheduled today).

const STATUSES = Object.freeze({
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
});

// Allowed forward transitions only.
const ALLOWED_TRANSITIONS = {
  [STATUSES.SCHEDULED]: [STATUSES.IN_PROGRESS],
  [STATUSES.IN_PROGRESS]: [STATUSES.COMPLETED],
  [STATUSES.COMPLETED]: [],
};

class AircraftStore {
  constructor() {
    /** @type {Map<string, object>} */
    this.aircraft = new Map();
  }

  /**
   * Register a new aircraft.
   * Required: aircraftId, name, maintenanceDate (YYYY-MM-DD), engineerName.
   * Default status: SCHEDULED.
   */
  add({ aircraftId, name, maintenanceDate, engineerName }) {
    if (!aircraftId || !name || !maintenanceDate || !engineerName) {
      const err = new Error(
        'aircraftId, name, maintenanceDate, and engineerName are required.'
      );
      err.status = 400;
      throw err;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(maintenanceDate)) {
      const err = new Error('maintenanceDate must be in YYYY-MM-DD format.');
      err.status = 400;
      throw err;
    }

    if (this.aircraft.has(aircraftId)) {
      const err = new Error(`aircraftId '${aircraftId}' already exists.`);
      err.status = 409;
      throw err;
    }

    const now = new Date().toISOString();
    const record = {
      aircraftId,
      name,
      status: STATUSES.SCHEDULED,
      maintenanceDate,
      engineerName,
      history: [{ status: STATUSES.SCHEDULED, at: now }],
    };
    this.aircraft.set(aircraftId, record);
    return record;
  }

  list() {
    return Array.from(this.aircraft.values());
  }

  get(aircraftId) {
    return this.aircraft.get(aircraftId) || null;
  }

  /**
   * Update status enforcing forward-only transitions.
   */
  updateStatus(aircraftId, nextStatus) {
    const record = this.aircraft.get(aircraftId);
    if (!record) {
      const err = new Error(`Aircraft '${aircraftId}' not found.`);
      err.status = 404;
      throw err;
    }

    if (!Object.values(STATUSES).includes(nextStatus)) {
      const err = new Error(
        `Invalid status '${nextStatus}'. Allowed: ${Object.values(STATUSES).join(', ')}.`
      );
      err.status = 400;
      throw err;
    }

    const allowed = ALLOWED_TRANSITIONS[record.status] || [];
    if (!allowed.includes(nextStatus)) {
      const err = new Error(
        `Invalid transition: ${record.status} -> ${nextStatus}. ` +
          `Allowed next: [${allowed.join(', ') || 'none'}].`
      );
      err.status = 400;
      throw err;
    }

    record.status = nextStatus;
    record.history.push({ status: nextStatus, at: new Date().toISOString() });
    return record;
  }

  listInProgress() {
    return this.list().filter((a) => a.status === STATUSES.IN_PROGRESS);
  }

  listScheduledToday() {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
    return this.list().filter(
      (a) => a.status === STATUSES.SCHEDULED && a.maintenanceDate === today
    );
  }

  summary() {
    const all = this.list();
    return {
      total: all.length,
      scheduled: all.filter((a) => a.status === STATUSES.SCHEDULED).length,
      inProgress: all.filter((a) => a.status === STATUSES.IN_PROGRESS).length,
      completed: all.filter((a) => a.status === STATUSES.COMPLETED).length,
    };
  }
}

module.exports = { AircraftStore, STATUSES };
