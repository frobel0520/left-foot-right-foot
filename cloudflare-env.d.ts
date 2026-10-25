declare namespace Cloudflare {
  interface Env {
    // The game runs without D1; getDb() rejects a missing optional binding.
    DB?: D1Database;
  }
}
