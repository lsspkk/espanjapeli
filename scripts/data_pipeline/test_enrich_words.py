#!/usr/bin/env python3
"""Tests for enrich_words.py."""

import pytest
from enrich_words import (
    spanish_to_id,
    IdGenerator,
    parse_words_ts,
    enrich_words,
    get_statistics,
    Word,
    EnrichedWord,
)


class TestSpanishToId:
    """Tests for spanish_to_id function."""
    
    def test_simple_word(self):
        assert spanish_to_id("perro") == "perro"
        
    def test_accented_word(self):
        assert spanish_to_id("niño") == "nino"
        assert spanish_to_id("árbol") == "arbol"
        assert spanish_to_id("café") == "cafe"
        
    def test_multi_word_phrase(self):
        assert spanish_to_id("por favor") == "por_favor"
        assert spanish_to_id("de nada") == "de_nada"
        
    def test_punctuation(self):
        assert spanish_to_id("¿Cómo estás?") == "como_estas"
        assert spanish_to_id("¡Hola!") == "hola"
        
    def test_uppercase(self):
        assert spanish_to_id("HOLA") == "hola"
        assert spanish_to_id("Buenos Días") == "buenos_dias"
        
    def test_special_chars(self):
        assert spanish_to_id("año") == "ano"
        assert spanish_to_id("güe") == "gue"
        
    def test_with_pos_noun(self):
        assert spanish_to_id("banco", "noun") == "banco_n"
        
    def test_with_pos_verb(self):
        assert spanish_to_id("banco", "verb") == "banco_v"
        
    def test_with_pos_adjective(self):
        assert spanish_to_id("grande", "adjective") == "grande_adj"
        
    def test_with_pos_phrase(self):
        assert spanish_to_id("por favor", "phrase") == "por_favor_phr"


class TestIdGenerator:
    """Tests for IdGenerator class."""
    
    def test_unique_words(self):
        gen = IdGenerator()
        assert gen.generate("perro") == "perro"
        assert gen.generate("gato") == "gato"
        assert gen.generate("casa") == "casa"
        
    def test_duplicate_words(self):
        gen = IdGenerator()
        assert gen.generate("banco") == "banco"
        assert gen.generate("banco") == "banco_2"
        assert gen.generate("banco") == "banco_3"
        
    def test_mixed_duplicates(self):
        gen = IdGenerator()
        assert gen.generate("perro") == "perro"
        assert gen.generate("gato") == "gato"
        assert gen.generate("perro") == "perro_2"
        assert gen.generate("gato") == "gato_2"
        
    def test_with_pos_no_collision(self):
        gen = IdGenerator()
        assert gen.generate("banco", "noun") == "banco_n"
        assert gen.generate("banco", "verb") == "banco_v"
        
    def test_with_pos_collision(self):
        gen = IdGenerator()
        assert gen.generate("banco", "noun") == "banco_n"
        assert gen.generate("banco", "noun") == "banco_n_2"


class TestParseWordsTs:
    """Tests for parse_words_ts function."""
    
    def test_single_category(self):
        content = '''
        const WORD_CATEGORIES = {
            animals: {
                name: 'Eläimet',
                words: [
                    { spanish: 'perro', english: 'dog', finnish: 'koira' },
                    { spanish: 'gato', english: 'cat', finnish: 'kissa' }
                ]
            }
        };
        '''
        words = parse_words_ts(content)
        assert len(words) == 2
        assert words[0].spanish == 'perro'
        assert words[0].english == 'dog'
        assert words[0].finnish == 'koira'
        assert words[0].category == 'animals'
        
    def test_with_learning_tips(self):
        content = '''
        const WORD_CATEGORIES = {
            common: {
                name: 'Yleisiä',
                words: [
                    { spanish: 'hola', english: 'hello', finnish: 'hei', learningTips: ["tip1", "tip2"] }
                ]
            }
        };
        '''
        words = parse_words_ts(content)
        assert len(words) == 1
        assert words[0].learning_tips == ["tip1", "tip2"]
        
    def test_multiple_categories(self):
        content = '''
        const WORD_CATEGORIES = {
            animals: {
                name: 'Eläimet',
                words: [
                    { spanish: 'perro', english: 'dog', finnish: 'koira' }
                ]
            },
            colors: {
                name: 'Värit',
                words: [
                    { spanish: 'rojo', english: 'red', finnish: 'punainen' }
                ]
            }
        };
        '''
        words = parse_words_ts(content)
        assert len(words) == 2
        assert words[0].category == 'animals'
        assert words[1].category == 'colors'


class TestEnrichWords:
    """Tests for enrich_words function."""
    
    def test_word_with_frequency(self):
        words = [Word("perro", "dog", "koira", "animals")]
        freq_data = {
            "perro": {"rank": 847, "cefr": "A2"}
        }
        
        enriched = enrich_words(words, freq_data)
        
        assert len(enriched) == 1
        assert enriched[0].id == "perro"
        assert enriched[0].frequency_rank == 847
        assert enriched[0].cefr_level == "A2"
        
    def test_word_without_frequency(self):
        words = [Word("elefante", "elephant", "norsu", "animals")]
        freq_data = {}
        
        enriched = enrich_words(words, freq_data)
        
        assert len(enriched) == 1
        assert enriched[0].frequency_rank is None
        assert enriched[0].cefr_level is None
        
    def test_case_insensitive_matching(self):
        words = [Word("Perro", "dog", "koira", "animals")]
        freq_data = {
            "perro": {"rank": 847, "cefr": "A2"}
        }
        
        enriched = enrich_words(words, freq_data)
        assert enriched[0].frequency_rank == 847
        
    def test_preserves_learning_tips(self):
        words = [Word("hola", "hello", "hei", "common", ["tip1", "tip2"])]
        freq_data = {"hola": {"rank": 50, "cefr": "A1"}}
        
        enriched = enrich_words(words, freq_data)
        assert enriched[0].learning_tips == ["tip1", "tip2"]


class TestGetStatistics:
    """Tests for get_statistics function."""
    
    def test_basic_stats(self):
        enriched = [
            EnrichedWord("perro", "perro", "dog", "koira", "animals", 847, "A2"),
            EnrichedWord("gato", "gato", "cat", "kissa", "animals", 1200, "A2"),
            EnrichedWord("elefante", "elefante", "elephant", "norsu", "animals", None, None),
        ]
        
        stats = get_statistics(enriched)
        
        assert stats['total_words'] == 3
        assert stats['with_frequency'] == 2
        assert stats['without_frequency'] == 1
        
    def test_cefr_distribution(self):
        enriched = [
            EnrichedWord("de", "de", "of", "-sta", "prep", 1, "A1"),
            EnrichedWord("perro", "perro", "dog", "koira", "animals", 847, "A2"),
            EnrichedWord("libro", "libro", "book", "kirja", "school", 500, "A1"),
        ]
        
        stats = get_statistics(enriched)
        
        assert stats['cefr_distribution']['A1'] == 2
        assert stats['cefr_distribution']['A2'] == 1
        
    def test_coverage_stats(self):
        enriched = [
            EnrichedWord("de", "de", "of", "-sta", "prep", 1, "A1"),      # top 100
            EnrichedWord("yo", "yo", "I", "minä", "pron", 50, "A1"),      # top 100
            EnrichedWord("perro", "perro", "dog", "koira", "animals", 847, "A2"),  # top 1000
            EnrichedWord("rare", "rare", "rare", "harva", "adj", 4500, "B2"),  # top 5000
        ]
        
        stats = get_statistics(enriched)
        
        assert stats['coverage']['top_100'] == 2
        assert stats['coverage']['top_500'] == 2
        assert stats['coverage']['top_1000'] == 3
        assert stats['coverage']['top_5000'] == 4


class TestInferPartOfSpeech:
    """Tests for infer_part_of_speech function."""
    
    def test_verb_category(self):
        from enrich_words import infer_part_of_speech
        assert infer_part_of_speech('verbs', 'to eat') == 'verb'
        
    def test_noun_category(self):
        from enrich_words import infer_part_of_speech
        assert infer_part_of_speech('animals', 'dog') == 'noun'
        assert infer_part_of_speech('food', 'bread') == 'noun'
        
    def test_adjective_category(self):
        from enrich_words import infer_part_of_speech
        assert infer_part_of_speech('colors', 'red') == 'adjective'
        assert infer_part_of_speech('adjectives', 'big') == 'adjective'
        
    def test_common_verb_by_english(self):
        from enrich_words import infer_part_of_speech
        # In common category, "to X" indicates verb
        assert infer_part_of_speech('common', 'to go') == 'verb'
        
    def test_common_adverb_by_english(self):
        from enrich_words import infer_part_of_speech
        assert infer_part_of_speech('common', 'now') == 'adverb'
        assert infer_part_of_speech('common', 'always') == 'adverb'


class TestInferGender:
    """Tests for infer_gender function."""
    
    def test_masculine_o_ending(self):
        from enrich_words import infer_gender
        assert infer_gender('perro', 'animals', 'noun') == 'masculine'
        assert infer_gender('libro', 'school', 'noun') == 'masculine'
        
    def test_feminine_a_ending(self):
        from enrich_words import infer_gender
        assert infer_gender('casa', 'home', 'noun') == 'feminine'
        assert infer_gender('ventana', 'home', 'noun') == 'feminine'
        
    def test_feminine_cion_ending(self):
        from enrich_words import infer_gender
        assert infer_gender('televisión', 'home', 'noun') == 'feminine'
        assert infer_gender('estación', 'places', 'noun') == 'feminine'
        
    def test_exception_dia(self):
        from enrich_words import infer_gender
        # día ends in -a but is masculine
        assert infer_gender('día', 'time', 'noun') == 'masculine'
        
    def test_exception_mano(self):
        from enrich_words import infer_gender
        # mano ends in -o but is feminine
        assert infer_gender('mano', 'body', 'noun') == 'feminine'
        
    def test_non_noun_returns_none(self):
        from enrich_words import infer_gender
        assert infer_gender('rojo', 'colors', 'adjective') is None
        assert infer_gender('correr', 'verbs', 'verb') is None


class TestIntegration:
    """Integration tests for the enrichment pipeline."""
    
    def test_full_pipeline(self):
        """Test the complete enrichment process."""
        content = '''
        export const WORD_CATEGORIES = {
            animals: {
                name: 'Eläimet',
                words: [
                    { spanish: 'perro', english: 'dog', finnish: 'koira' },
                    { spanish: 'gato', english: 'cat', finnish: 'kissa' }
                ]
            },
            common: {
                name: 'Yleisiä',
                words: [
                    { spanish: 'sí', english: 'yes', finnish: 'kyllä' },
                    { spanish: 'no', english: 'no', finnish: 'ei' }
                ]
            }
        };
        '''
        
        freq_data = {
            "perro": {"rank": 847, "cefr": "A2"},
            "gato": {"rank": 1500, "cefr": "A2"},
            "sí": {"rank": 25, "cefr": "A1"},
            "no": {"rank": 3, "cefr": "A1"}
        }
        
        words = parse_words_ts(content)
        enriched = enrich_words(words, freq_data)
        stats = get_statistics(enriched)
        
        assert len(enriched) == 4
        assert stats['with_frequency'] == 4
        assert stats['match_rate'] == "100.0%"
        
        # Check IDs are unique
        ids = [w.id for w in enriched]
        assert len(ids) == len(set(ids))


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
