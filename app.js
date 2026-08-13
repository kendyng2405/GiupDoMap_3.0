// app.js — MVC2 Entry Point
import { router }               from "./controllers/Router.js";
import { AuthController }       from "./controllers/AuthController.js";
import { HomeController }       from "./controllers/HomeController.js";
import { ProfileController }    from "./controllers/ProfileController.js";
import { AdminController }      from "./controllers/AdminController.js";
import { SuggestionController } from "./controllers/SuggestionController.js";

router
  .register("/home",                     (ctx) => HomeController.show(ctx))
  .register("/login",                    (ctx) => AuthController.showLogin(ctx))
  .register("/register",                 (ctx) => AuthController.showRegister(ctx))
  .register("/forgot-password",          (ctx) => AuthController.showForgotPassword(ctx))
  .register("/profile",                  router.requireAuth((ctx) => ProfileController.show(ctx)))
  .register("/suggest",                  router.requireAuth((ctx) => SuggestionController.showForm(ctx)))
  .register("/admin/dashboard",          router.requireAdmin((ctx) => AdminController.dashboard(ctx)))
  .register("/admin/locations/new",      router.requireAdmin((ctx) => AdminController.showCreate(ctx)))
  .register("/admin/locations/:id/edit", router.requireAdmin((ctx) => AdminController.showEdit(ctx)))
  .register("/admin/suggestions",        router.requireAdmin((ctx) => SuggestionController.showList(ctx)))
  .register("/admin/ai-moderator",       router.requireAdmin((ctx) => AdminController.showAIModerator(ctx)))
  .register("/admin/users",              router.requireFounder((ctx) => AdminController.showUsers(ctx)));

document.addEventListener("click", (e) => {
  if (e.target.closest("#logout-btn") || e.target.closest("#mob-logout-btn")) {
    e.preventDefault();
    AuthController.logout();
  }
});

router.init();
