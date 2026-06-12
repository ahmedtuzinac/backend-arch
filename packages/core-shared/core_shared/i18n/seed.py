from core_shared.i18n.models import Language, Translation

DEFAULT_TRANSLATIONS = {
    "en": {
        "app.home": "Home",
        "app.health": "Health",
        "app.users": "Users",
        "app.profile": "Profile",
        "app.files": "Files",
        "app.audit": "Audit Log",
        "app.settings": "Settings",
        "app.signout": "Sign out",
        "app.signin": "Sign in",
        "app.welcome": "Welcome",
        "app.loading": "Loading...",
        "users.title": "Users",
        "users.add": "Add user",
        "users.email": "Email",
        "users.role": "Role",
        "users.status": "Status",
        "users.created": "Created",
        "users.actions": "Actions",
        "users.edit": "Edit",
        "users.deactivate": "Deactivate",
        "users.search": "Search by name or email...",
        "files.title": "Files",
        "files.upload": "Upload files",
        "files.search": "Search files...",
        "files.empty": "No files uploaded yet",
        "files.delete": "Delete",
        "files.download": "Download",
        "files.copylink": "Copy link",
        "files.copied": "Copied!",
        "profile.title": "Profile",
        "profile.info": "Account info",
        "profile.personal": "Personal information",
        "profile.password": "Change password",
        "profile.save": "Save changes",
        "settings.title": "Settings",
        "settings.save": "Save settings",
        "settings.saved": "Settings saved",
        "health.title": "Service Health",
        "health.operational": "All Systems Operational",
        "health.degraded": "Degraded",
        "health.offline": "Services Offline",
        "health.refresh": "Refresh",
        "audit.title": "Audit Log",
        "audit.all_actions": "All actions",
        "common.previous": "Previous",
        "common.next": "Next",
        "common.cancel": "Cancel",
        "common.create": "Create",
        "common.update": "Update",
        "common.saving": "Saving...",
        "common.active": "Active",
        "common.inactive": "Inactive",
        "common.online": "Online",
        "common.offline": "Offline",
    },
}


async def ensure_default_languages():
    for code, translations in DEFAULT_TRANSLATIONS.items():
        lang, created = await Language.get_or_create(
            code=code,
            defaults={"name": "English" if code == "en" else code, "is_default": code == "en"},
        )
        if created:
            for key, value in translations.items():
                await Translation.get_or_create(
                    language=lang,
                    key=key,
                    defaults={"value": value},
                )
