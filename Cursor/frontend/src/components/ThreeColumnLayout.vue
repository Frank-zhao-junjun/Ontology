<template>
  <div class="layout">
    <aside class="col left">
      <slot name="left" />
    </aside>
    <main class="col center">
      <slot name="center" />
    </main>
    <aside class="col right">
      <slot name="right" />
    </aside>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) minmax(400px, 2.2fr) minmax(220px, 1fr);
  height: 100vh;
  gap: 1px;
  background: #cbd5e1;
}
.col {
  background: #f8fafc;
  overflow: auto;
  padding: 12px;
}
.left {
  border-right: 1px solid #e2e8f0;
}
.right {
  border-left: 1px solid #e2e8f0;
}
</style>
