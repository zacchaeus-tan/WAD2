<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="container">
    <div class="p-5 mb-4 bg-body-tertiary rounded-3">
      <h1 class="display-6">Know whether a trek matches you before you go</h1>
      <p class="col-md-9 fs-5 text-muted">
        Southeast Asian routes with day-by-day itineraries, live weather, a packing list built for
        the trip, and difficulty ratings corrected by the people who actually walked them.
      </p>
      <RouterLink class="btn btn-success btn-lg me-2" to="/routes">Browse routes</RouterLink>
      <RouterLink class="btn btn-outline-secondary btn-lg" to="/quiz">Take the quiz</RouterLink>
    </div>

    <div class="row g-3">
      <div class="col-md-4">
        <div class="card h-100"><div class="card-body">
          <h2 class="h6">Difficulty matched to you</h2>
          <p class="small text-muted mb-0">A fitness score from your quiz, compared against what each route demands.</p>
        </div></div>
      </div>
      <div class="col-md-4">
        <div class="card h-100"><div class="card-body">
          <h2 class="h6">Corrected by the community</h2>
          <p class="small text-muted mb-0">When hikers consistently rate a route harder than its official grade, the grade moves.</p>
        </div></div>
      </div>
      <div class="col-md-4">
        <div class="card h-100"><div class="card-body">
          <h2 class="h6">Hazards flagged where they happen</h2>
          <p class="small text-muted mb-0">Incident reports pinned to the checkpoint they occurred at.</p>
        </div></div>
      </div>
    </div>
  </div>
</template>
