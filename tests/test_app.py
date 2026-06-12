import copy
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT_DIR))

from src.app import app, activities


client = TestClient(app)
ORIGINAL_ACTIVITIES = copy.deepcopy(activities)


@pytest.fixture(autouse=True)
def reset_activities():
    # Arrange: reset in-memory data before and after each test
    activities.clear()
    activities.update(copy.deepcopy(ORIGINAL_ACTIVITIES))

    yield

    activities.clear()
    activities.update(copy.deepcopy(ORIGINAL_ACTIVITIES))


def test_get_activities_returns_available_activities():
    # Arrange

    # Act
    response = client.get("/activities")

    # Assert
    assert response.status_code == 200

    data = response.json()
    assert "Chess Club" in data
    assert "Programming Class" in data
    assert "Gym Class" in data
    assert "participants" in data["Chess Club"]


def test_signup_for_activity_adds_participant():
    # Arrange
    activity_name = "Chess Club"
    email = "alex@mergington.edu"

    # Act
    response = client.post(
        f"/activities/{activity_name}/signup",
        params={"email": email},
    )

    # Assert
    assert response.status_code == 200
    assert response.json()["message"] == f"Signed up {email} for {activity_name}"
    assert email in activities[activity_name]["participants"]


def test_signup_for_unknown_activity_returns_404():
    # Arrange
    activity_name = "Unknown Activity"
    email = "alex@mergington.edu"

    # Act
    response = client.post(
        f"/activities/{activity_name}/signup",
        params={"email": email},
    )

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"