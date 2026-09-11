const teamGrid = document.getElementById("team-grid");

const availableCount = document.getElementById("available-count");
const busyCount = document.getElementById("busy-count");
const awayCount = document.getElementById("away-count");
const totalCount = document.getElementById("total-count");

const memberForm = document.getElementById("member-form");
const refreshBtn = document.getElementById("refresh-btn");

// Load team members
async function loadTeam() {
    try {
        const response = await fetch("/api/team");

        if (!response.ok) {
            throw new Error("Failed to load team");
        }

        const members = await response.json();

        updateStats(members);
        renderMembers(members);

    } catch (error) {
        teamGrid.innerHTML = `
            <div class="empty">
                Unable to load team members.
            </div>
        `;
    }
}

// Update statistics
function updateStats(members) {
    const available = members.filter(
        member => member.status === "Available"
    ).length;

    const busy = members.filter(
        member => member.status === "Busy"
    ).length;

    const away = members.filter(
        member => member.status === "Away"
    ).length;

    availableCount.textContent = available;
    busyCount.textContent = busy;
    awayCount.textContent = away;
    totalCount.textContent = members.length;
}

// Render members
function renderMembers(members) {

    if (members.length === 0) {
        teamGrid.innerHTML = `
            <div class="empty">
                No team members found.
            </div>
        `;
        return;
    }

    teamGrid.innerHTML = members.map(member => {

        const initial = member.name.charAt(0).toUpperCase();

        const updated = new Date(member.updated_at)
            .toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            });

        return `
            <div class="member-card">

                <div class="member-top">

                    <div class="avatar">
                        ${initial}
                    </div>

                    <div>
                        <div class="member-name">
                            ${escapeHtml(member.name)}
                        </div>

                        <div class="member-role">
                            ${escapeHtml(member.role)}
                        </div>
                    </div>

                </div>

                <div class="status-row">

                    <span class="status-badge status-${member.status}">
                        ${getStatusIcon(member.status)}
                        ${member.status}
                    </span>

                    <select
                        class="status-select"
                        onchange="changeStatus(${member.id}, this.value)"
                    >

                        <option
                            value="Available"
                            ${member.status === "Available" ? "selected" : ""}
                        >
                            Available
                        </option>

                        <option
                            value="Busy"
                            ${member.status === "Busy" ? "selected" : ""}
                        >
                            Busy
                        </option>

                        <option
                            value="Away"
                            ${member.status === "Away" ? "selected" : ""}
                        >
                            Away
                        </option>

                    </select>

                </div>

                <div class="updated">
                    Last updated: ${updated}
                </div>

                <button
                    class="delete-btn"
                    onclick="deleteMember(${member.id})"
                >
                    🗑️ Remove Member
                </button>

            </div>
        `;

    }).join("");
}

// Change status
async function changeStatus(id, status) {

    try {

        const response = await fetch(`/api/team/${id}/status`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ status })
        });

        if (!response.ok) {
            throw new Error("Status update failed");
        }

        await loadTeam();

    } catch (error) {
        alert("Unable to update status.");
    }
}

// Add member
memberForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const role = document.getElementById("role").value.trim();

    try {

        const response = await fetch("/api/team", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, role })
        });

        if (!response.ok) {
            throw new Error("Could not add member");
        }

        memberForm.reset();

        await loadTeam();

    } catch (error) {
        alert("Unable to add team member.");
    }
});

// Delete member
async function deleteMember(id) {

    if (!confirm("Remove this team member?")) {
        return;
    }

    try {

        const response = await fetch(`/api/team/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("Delete failed");
        }

        await loadTeam();

    } catch (error) {
        alert("Unable to remove member.");
    }
}

// Status icons
function getStatusIcon(status) {

    if (status === "Available") {
        return "🟢";
    }

    if (status === "Busy") {
        return "🟡";
    }

    return "🔴";
}

// Prevent HTML injection
function escapeHtml(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}

// Manual refresh
refreshBtn.addEventListener("click", loadTeam);

// Live auto-refresh every 5 seconds
setInterval(loadTeam, 5000);

// Initial load
loadTeam();