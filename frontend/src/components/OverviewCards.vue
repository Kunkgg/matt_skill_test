<template>
  <div class="overview-cards">
    <el-card
      v-for="card in cards"
      :key="card.key"
      class="overview-cards__card"
      shadow="never"
      :style="{ '--card-accent': card.accent }"
    >
      <div class="overview-cards__content">
        <span class="overview-cards__label">{{ card.label }}</span>
        <span
          class="overview-cards__value"
          :style="{ color: card.valueColor }"
        >
          {{ card.value }}
        </span>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  stats: {
    type: Object,
    required: true,
  },
})

const cards = computed(() => [
  {
    key: 'total',
    label: '任务数',
    value: props.stats.totalTasks ?? 0,
    accent: 'var(--color-primary)',
    valueColor: 'var(--color-card-foreground)',
  },
  {
    key: 'noResult',
    label: '无扫描结果任务',
    value: props.stats.noResultTasks ?? 0,
    accent: 'var(--color-neutral)',
    valueColor: 'var(--color-muted-foreground)',
  },
  {
    key: 'hasMissing',
    label: '有缺失文件任务',
    value: props.stats.hasMissingTasks ?? 0,
    accent: 'var(--color-missed)',
    valueColor: props.stats.hasMissingTasks ? 'var(--color-missed)' : 'var(--color-muted-foreground)',
  },
  {
    key: 'hasExpired',
    label: '有过期缺失任务',
    value: props.stats.hasExpiredMissingTasks ?? 0,
    accent: 'var(--color-expired)',
    valueColor: props.stats.hasExpiredMissingTasks ? 'var(--color-expired)' : 'var(--color-muted-foreground)',
  },
])
</script>

<style scoped>
.overview-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.overview-cards__card {
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--card-accent, var(--color-primary));
  background: var(--color-card);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.overview-cards__card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.overview-cards__content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px 0;
}

.overview-cards__label {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.overview-cards__value {
  font-family: var(--font-display);
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.5px;
}

@media (max-width: 900px) {
  .overview-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 500px) {
  .overview-cards {
    grid-template-columns: 1fr;
  }
}
</style>
