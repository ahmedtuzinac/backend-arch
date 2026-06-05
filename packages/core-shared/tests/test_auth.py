from datetime import timedelta

import pytest

from core_shared.auth.jwt import create_access_token, decode_token

SECRET_KEY = "test-secret-key-that-is-long-enough-for-hs256"


def test_create_and_decode_token():
    token = create_access_token(
        data={"sub": "123", "scopes": ["read:users"]},
        secret_key=SECRET_KEY,
        expires_delta=timedelta(minutes=15),
    )
    payload = decode_token(token, secret_key=SECRET_KEY)
    assert payload.sub == "123"
    assert payload.scopes == ["read:users"]
    assert payload.exp is not None


def test_decode_expired_token():
    token = create_access_token(
        data={"sub": "123", "scopes": []},
        secret_key=SECRET_KEY,
        expires_delta=timedelta(seconds=-1),
    )
    with pytest.raises(ValueError, match="Token has expired"):
        decode_token(token, secret_key=SECRET_KEY)


def test_decode_invalid_token():
    with pytest.raises(ValueError, match="Invalid token"):
        decode_token("not-a-real-token", secret_key=SECRET_KEY)
