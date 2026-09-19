package core

import (
	"testing"
	"time"
)

func TestPostHotness(t *testing.T) {
	base := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	cases := []struct {
		name               string
		upvotes, downvotes int
		date               time.Time
		want               int
	}{
		{"no votes scores zero", 0, 0, base, 0},
		{"equal up/down votes cancel out (symmetry)", 3, 3, base, 0},
		{"downvotes pull score below neutral", 0, 2, base, -29216989700},
		{"upvotes push score above neutral", 2, 0, base, 29223010300},
	}
	for _, c := range cases {
		if got := PostHotness(c.upvotes, c.downvotes, c.date); got != c.want {
			t.Errorf("%s: PostHotness(%d, %d, %v) = %d, want %d",
				c.name, c.upvotes, c.downvotes, c.date, got, c.want)
		}
	}
}

func TestPostHotnessOrdering(t *testing.T) {
	base := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	if five, two := PostHotness(5, 0, base), PostHotness(2, 0, base); five <= two {
		t.Errorf("expected 5up/0down (%d) to outrank 2up/0down (%d) at the same timestamp", five, two)
	}

	// Real-world regression: a newer post whose 1up/1down votes cancel out
	// must not outrank an older post with a clean 3up/0down record.
	newer := time.Date(2026, 9, 4, 3, 31, 5, 0, time.UTC)   // 1up/1down
	older := time.Date(2026, 9, 1, 20, 33, 25, 0, time.UTC) // 3up/0down
	newerHotness := PostHotness(1, 1, newer)
	olderHotness := PostHotness(3, 0, older)
	if olderHotness <= newerHotness {
		t.Errorf("regression: older 3up/0down post (%d) should outrank newer, canceled-out 1up/1down post (%d)",
			olderHotness, newerHotness)
	}
}
