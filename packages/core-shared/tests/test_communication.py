from core_shared.communication import ServiceClient


def test_client_initializes():
    client = ServiceClient(base_url="http://localhost:8000")
    assert client.base_url == "http://localhost:8000"
    assert client.timeout == 10.0
    assert client.max_retries == 3


def test_client_custom_config():
    client = ServiceClient(base_url="http://auth:8001", timeout=5.0, max_retries=1)
    assert client.base_url == "http://auth:8001"
    assert client.timeout == 5.0
    assert client.max_retries == 1
