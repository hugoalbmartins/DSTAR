// vite.config.js
import { defineConfig, loadEnv } from "file:///home/project/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
var __vite_injected_original_dirname = "/home/project/frontend";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__vite_injected_original_dirname, ".."), "");
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    },
    envDir: path.resolve(__vite_injected_original_dirname, ".."),
    server: {
      port: 3e3,
      host: true,
      strictPort: false,
      hmr: {
        clientPort: 3e3
      }
    },
    preview: {
      port: 3e3,
      host: true,
      strictPort: false
    },
    build: {
      outDir: "dist",
      sourcemap: false,
      chunkSizeWarningLimit: 1e3,
      copyPublicDir: false,
      rollupOptions: {
        output: {
          manualChunks: {
            recharts: ["recharts"],
            "ui-components": [
              "@/components/ui/card",
              "@/components/ui/button",
              "@/components/ui/input",
              "@/components/ui/select",
              "@/components/ui/dialog",
              "@/components/ui/table"
            ]
          }
        }
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0L2Zyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3QvZnJvbnRlbmQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xuICBjb25zdCBlbnYgPSBsb2FkRW52KG1vZGUsIHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLicpLCAnJylcblxuICByZXR1cm4ge1xuICAgIHBsdWdpbnM6IFtyZWFjdCgpXSxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxuICAgICAgfSxcbiAgICB9LFxuICAgIGVudkRpcjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uJyksXG4gICAgc2VydmVyOiB7XG4gICAgICBwb3J0OiAzMDAwLFxuICAgICAgaG9zdDogdHJ1ZSxcbiAgICAgIHN0cmljdFBvcnQ6IGZhbHNlLFxuICAgICAgaG1yOiB7XG4gICAgICAgIGNsaWVudFBvcnQ6IDMwMDAsXG4gICAgICB9LFxuICAgIH0sXG4gICAgcHJldmlldzoge1xuICAgICAgcG9ydDogMzAwMCxcbiAgICAgIGhvc3Q6IHRydWUsXG4gICAgICBzdHJpY3RQb3J0OiBmYWxzZSxcbiAgICB9LFxuICAgIGJ1aWxkOiB7XG4gICAgICBvdXREaXI6ICdkaXN0JyxcbiAgICAgIHNvdXJjZW1hcDogZmFsc2UsXG4gICAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEwMDAsXG4gICAgICBjb3B5UHVibGljRGlyOiBmYWxzZSxcbiAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgb3V0cHV0OiB7XG4gICAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgICByZWNoYXJ0czogWydyZWNoYXJ0cyddLFxuICAgICAgICAgICAgJ3VpLWNvbXBvbmVudHMnOiBbXG4gICAgICAgICAgICAgICdAL2NvbXBvbmVudHMvdWkvY2FyZCcsXG4gICAgICAgICAgICAgICdAL2NvbXBvbmVudHMvdWkvYnV0dG9uJyxcbiAgICAgICAgICAgICAgJ0AvY29tcG9uZW50cy91aS9pbnB1dCcsXG4gICAgICAgICAgICAgICdAL2NvbXBvbmVudHMvdWkvc2VsZWN0JyxcbiAgICAgICAgICAgICAgJ0AvY29tcG9uZW50cy91aS9kaWFsb2cnLFxuICAgICAgICAgICAgICAnQC9jb21wb25lbnRzL3VpL3RhYmxlJ1xuICAgICAgICAgICAgXVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gIH1cbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQW9QLFNBQVMsY0FBYyxlQUFlO0FBQzFSLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFGakIsSUFBTSxtQ0FBbUM7QUFJekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFDeEMsUUFBTSxNQUFNLFFBQVEsTUFBTSxLQUFLLFFBQVEsa0NBQVcsSUFBSSxHQUFHLEVBQUU7QUFFM0QsU0FBTztBQUFBLElBQ0wsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBLElBQ2pCLFNBQVM7QUFBQSxNQUNQLE9BQU87QUFBQSxRQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxNQUN0QztBQUFBLElBQ0Y7QUFBQSxJQUNBLFFBQVEsS0FBSyxRQUFRLGtDQUFXLElBQUk7QUFBQSxJQUNwQyxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixZQUFZO0FBQUEsTUFDWixLQUFLO0FBQUEsUUFDSCxZQUFZO0FBQUEsTUFDZDtBQUFBLElBQ0Y7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLFlBQVk7QUFBQSxJQUNkO0FBQUEsSUFDQSxPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsTUFDUixXQUFXO0FBQUEsTUFDWCx1QkFBdUI7QUFBQSxNQUN2QixlQUFlO0FBQUEsTUFDZixlQUFlO0FBQUEsUUFDYixRQUFRO0FBQUEsVUFDTixjQUFjO0FBQUEsWUFDWixVQUFVLENBQUMsVUFBVTtBQUFBLFlBQ3JCLGlCQUFpQjtBQUFBLGNBQ2Y7QUFBQSxjQUNBO0FBQUEsY0FDQTtBQUFBLGNBQ0E7QUFBQSxjQUNBO0FBQUEsY0FDQTtBQUFBLFlBQ0Y7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
