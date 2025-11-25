import pytest
from flask import Flask
from blockchain import app
from blockchain_service import BlockchainService
from auth_service import auth_service


@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SECRET_KEY'] = 'test-secret-key'
    with app.test_client() as client:
        yield client


@pytest.fixture
def auth_token(client):
    response = client.post('/api/auth/login', json={
        'username': 'admin',
        'password': 'admin123'
    })
    data = response.get_json()
    return data['token']


class TestAPIIntegration:
    def test_login_success(self, client):
        response = client.post('/api/auth/login', json={
            'username': 'admin',
            'password': 'admin123'
        })

        assert response.status_code == 200
        data = response.get_json()
        assert 'token' in data
        assert 'user' in data

    def test_login_invalid_credentials(self, client):
        response = client.post('/api/auth/login', json={
            'username': 'admin',
            'password': 'wrongpassword'
        })

        assert response.status_code == 401

    def test_verify_token_success(self, client, auth_token):
        response = client.get('/api/auth/verify', headers={
            'Authorization': f'Bearer {auth_token}'
        })

        assert response.status_code == 200
        data = response.get_json()
        assert 'username' in data
        assert 'role' in data

    def test_verify_token_invalid(self, client):
        response = client.get('/api/auth/verify', headers={
            'Authorization': 'Bearer invalid_token'
        })

        assert response.status_code == 401

    def test_api_stats_requires_auth(self, client):
        response = client.get('/api/stats')

        assert response.status_code == 401

    def test_api_stats_with_auth(self, client, auth_token):
        response = client.get('/api/stats', headers={
            'Authorization': f'Bearer {auth_token}'
        })

        assert response.status_code == 200
        data = response.get_json()
        assert 'total_blocks' in data

    def test_api_records_requires_auth(self, client):
        response = client.get('/api/records')

        assert response.status_code == 401

    def test_api_records_with_auth(self, client, auth_token):
        response = client.get('/api/records', headers={
            'Authorization': f'Bearer {auth_token}'
        })

        assert response.status_code == 200
        data = response.get_json()
        assert 'records' in data
        assert 'count' in data

    def test_api_analytics_requires_auth(self, client):
        response = client.get('/api/analytics')

        assert response.status_code == 401

    def test_api_analytics_with_auth(self, client, auth_token):
        response = client.get('/api/analytics', headers={
            'Authorization': f'Bearer {auth_token}'
        })

        assert response.status_code == 200
        data = response.get_json()
        assert 'overview' in data

