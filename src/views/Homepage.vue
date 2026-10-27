<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="container homepage py-5">
    <section class="homepage-hero mb-5" aria-labelledby="homepage-title">
      <p class="eyebrow mb-3">Plan your next trek</p>
      <h1 id="homepage-title" class="display-3 fw-semibold mb-4">
        Know whether a trek matches you before you go
      </h1>
      <p class="lead homepage-intro mb-4">
        Explore Southeast Asian routes with day-by-day itineraries, live weather, trip-ready packing
        lists, and difficulty ratings shaped by the people who walked them.
      </p>
      <div class="d-flex flex-wrap gap-3">
        <RouterLink class="btn btn-outline-secondary btn-lg" to="/routes">Browse routes</RouterLink>
        <RouterLink class="btn btn-outline-secondary btn-lg" to="/quiz">Take the quiz</RouterLink>
      </div>
    </section>

    <section aria-labelledby="features-title">
      <div class="mb-4">
        <p class="eyebrow mb-2">Made for better planning</p>
        <h2 id="features-title" class="h3 mb-0">More confidence for every step</h2>
      </div>

      <div class="row row-cols-1 row-cols-md-3 g-4">
        <div class="col">
          <article class="feature-card">
            <p class="feature-number mb-4">01</p>
            <h3 class="h5 mb-3">Difficulty matched to you</h3>
            <p class="mb-0">
              Compare your quiz fitness score with what each route demands before you commit.
            </p>
          </article>
        </div>
        <div class="col">
          <article class="feature-card">
            <p class="feature-number mb-4">02</p>
            <h3 class="h5 mb-3">Corrected by the community</h3>
            <p class="mb-0">
              When hikers consistently rate a route harder than its official grade, the grade moves.
            </p>
          </article>
        </div>
        <div class="col">
          <article class="feature-card">
            <p class="feature-number mb-4">03</p>
            <h3 class="h5 mb-3">Hazards flagged where they happen</h3>
            <p class="mb-0">See incident reports pinned to the checkpoint where they occurred.</p>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.homepage {
  max-width: 1200px;
}

.homepage-hero {
  padding: clamp(1.5rem, 5vw, 4rem) 0;
}

.homepage-hero h1 {
  max-width: 900px;
  line-height: 1.08;
}

.homepage-intro {
  max-width: 760px;
  line-height: 1.7;
}

.eyebrow,
.feature-number {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.feature-number {
  opacity: 0.65;
}

.feature-card {
  height: 100%;
  padding: 1.5rem;
  border: 1px solid currentColor;
  border-radius: 0.75rem;
}
</style>
