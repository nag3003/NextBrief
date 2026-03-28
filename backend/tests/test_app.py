import unittest
from backend.app import app, get_system_prompt

class AppTestCase(unittest.TestCase):
    def setUp(self):
        app.testing = True
        self.client = app.test_client()

    def test_health_endpoint(self):
        resp = self.client.get('/health')
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn('status', data)

    def test_get_news_endpoint(self):
        payload = {"query": "latest technology news", "role": "student", "domain": "all", "language": "English", "location": "Global"}
        resp = self.client.post('/get-news', json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn('articles', data)
        self.assertIn('enhanced', data)

    def test_system_prompt_contains_keys(self):
        p = get_system_prompt('student', 'all', 'English')
        self.assertIn('headlines', p)
        self.assertIn('lead', p)
        self.assertIn('key_points', p)
        self.assertIn('insights', p)

if __name__ == '__main__':
    unittest.main()
