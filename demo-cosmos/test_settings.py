import unittest
from settings import merge_settings

class SettingsTests(unittest.TestCase):
    def test_basic_override(self):
        self.assertEqual(merge_settings({'theme': 'light'}, {'theme': 'dark'}), {'theme': 'dark'})

    def test_merges_nested_dictionaries_and_preserves_other_keys(self):
        defaults = {
            'theme': 'light',
            'database': {'host': 'localhost', 'port': 5432, 'ssl': True},
        }
        overrides = {'database': {'port': 5433, 'ssl': False}}

        self.assertEqual(
            merge_settings(defaults, overrides),
            {
                'theme': 'light',
                'database': {'host': 'localhost', 'port': 5433, 'ssl': False},
            },
        )

    def test_respects_explicit_falsy_values(self):
        defaults = {'enabled': True, 'retries': 3, 'label': 'default', 'token': 'abc'}
        overrides = {'enabled': False, 'retries': 0, 'label': '', 'token': None}

        self.assertEqual(
            merge_settings(defaults, overrides),
            {'enabled': False, 'retries': 0, 'label': '', 'token': None},
        )

    def test_replaces_lists_in_their_entirety(self):
        defaults = {'plugins': ['base', 'analytics']}
        overrides = {'plugins': ['custom']}

        self.assertEqual(merge_settings(defaults, overrides), {'plugins': ['custom']})

    def test_replaces_nested_objects_with_scalars_and_lists(self):
        defaults = {'scalar': {'nested': True}, 'list': {'nested': True}}
        overrides = {'scalar': 0, 'list': []}

        self.assertEqual(merge_settings(defaults, overrides), {'scalar': 0, 'list': []})

    def test_replaces_nested_scalars_and_lists_with_objects(self):
        defaults = {'scalar': 'old', 'list': ['old']}
        overrides = {'scalar': {'nested': True}, 'list': {}}

        self.assertEqual(
            merge_settings(defaults, overrides),
            {'scalar': {'nested': True}, 'list': {}},
        )

    def test_does_not_share_mutable_values_from_either_input(self):
        defaults = {'database': {'hosts': ['primary']}, 'features': ['search']}
        overrides = {'database': {'options': {'timeout': 30}}, 'plugins': ['custom']}

        merged = merge_settings(defaults, overrides)
        merged['database']['hosts'].append('replica')
        merged['database']['options']['timeout'] = 60
        merged['features'].append('export')
        merged['plugins'].append('extra')

        self.assertEqual(defaults, {'database': {'hosts': ['primary']}, 'features': ['search']})
        self.assertEqual(
            overrides,
            {'database': {'options': {'timeout': 30}}, 'plugins': ['custom']},
        )

if __name__ == '__main__':
    unittest.main()
