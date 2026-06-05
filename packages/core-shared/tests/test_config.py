from core_shared.config import BaseAppSettings


def test_base_settings_defaults():
    settings = BaseAppSettings(app_name="test-service")
    assert settings.app_name == "test-service"
    assert settings.debug is False
    assert settings.log_level == "INFO"


def test_base_settings_from_env(monkeypatch):
    monkeypatch.setenv("APP_NAME", "my-service")
    monkeypatch.setenv("DEBUG", "true")
    monkeypatch.setenv("LOG_LEVEL", "DEBUG")
    settings = BaseAppSettings()
    assert settings.app_name == "my-service"
    assert settings.debug is True
    assert settings.log_level == "DEBUG"
