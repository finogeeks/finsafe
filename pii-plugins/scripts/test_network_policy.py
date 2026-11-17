"""Validate the redactor's packaged configuration without private FinSAFE code."""
from pathlib import Path
import unittest

import yaml

ROOT = Path(__file__).resolve().parents[1]


class RedactorNetworkPolicy(unittest.TestCase):
    def test_example_declares_complete_proxy_and_external_processor(self):
        document = yaml.safe_load((ROOT / 'examples/redactor/network-policy.example.yaml').read_text(encoding='utf-8'))
        self.assertEqual(set(document), {'network'})
        network = document['network']
        self.assertEqual(network['mode'], 'proxy')
        self.assertIs(network['tls_terminate'], True)
        self.assertEqual(network['endpoints'], ['*.*'])
        content = network['llm_content']
        self.assertIs(content['retention'], True)
        self.assertGreater(content['max_body_bytes'], 0)
        self.assertEqual(len(content['plugins']), 1)
        plugin = content['plugins'][0]
        self.assertTrue(plugin['id'])
        self.assertEqual(plugin['detector'], 'external')
        self.assertEqual(plugin['on_finding'], 'warning')
        self.assertEqual(plugin['executable'], 'finsafe-pii-redactor.exe')
        self.assertGreater(plugin['timeout_ms'], 0)
        self.assertIs(plugin['allow_rewrite'], True)


if __name__ == '__main__':
    unittest.main()
