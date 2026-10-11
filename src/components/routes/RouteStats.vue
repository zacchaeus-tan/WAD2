<script setup>
defineProps({
  route: { type: Object, required: true },
})
</script>

<template>
  <div class="row g-3 mb-4">
    <div class="col-6 col-md-3"><div class="card text-center p-2">
      <small class="text-muted">Distance</small>
      <strong>{{ route.distance_km != null ? `${route.distance_km} km` : 'Not available' }}</strong>
    </div></div>
    <div class="col-6 col-md-3"><div class="card text-center p-2">
      <small class="text-muted">Elevation gain</small>
      <strong>{{ route.elevation_gain_m != null ? `${route.elevation_gain_m} m` : 'Not available' }}</strong>
    </div></div>
    <div class="col-6 col-md-3"><div class="card text-center p-2">
      <small class="text-muted">Duration</small>
      <strong>{{ route.duration_days != null ? `${route.duration_days} day(s)` : 'Not available' }}</strong>
    </div></div>
    <div class="col-6 col-md-3"><div class="card text-center p-2">
      <small class="text-muted">Max altitude</small>
      <strong>{{ route.altitude_m != null ? `${route.altitude_m} m` : 'Not available' }}</strong>
    </div></div>
  </div>
</template>
