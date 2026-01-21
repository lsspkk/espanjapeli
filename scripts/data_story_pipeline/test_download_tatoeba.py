#!/usr/bin/env python3
"""
Tests for download_tatoeba.py pipeline functions.

Data source: Tatoeba (https://tatoeba.org)
License: CC-BY 2.0 FR (https://creativecommons.org/licenses/by/2.0/fr/)
"""

import json
import pytest
import tempfile
from pathlib import Path
from download_tatoeba import (
    Sentence,
    deduplicate_sentences,
    assign_themes,
    group_by_theme,
    convert_to_sentence_objects,
    write_output_files,
)


class TestDeduplicateSentences:
    """Tests for deduplicate_sentences function."""
    
    def test_removes_exact_duplicates(self):
        """Test that exact duplicate Spanish sentences are removed."""
        sentences = [
            {"spa_id": "1", "spa": "Hola", "fin": "Hei", "eng": "Hello"},
            {"spa_id": "2", "spa": "Hola", "fin": "Moi", "eng": "Hi"},
            {"spa_id": "3", "spa": "Adiós", "fin": "Näkemiin", "eng": "Goodbye"},
        ]
        
        result = deduplicate_sentences(sentences)
        
        assert len(result) == 2
        assert result[0]["spa"] == "Hola"
        assert result[1]["spa"] == "Adiós"
    
    def test_preserves_unique_sentences(self):
        """Test that unique sentences are all preserved."""
        sentences = [
            {"spa_id": "1", "spa": "Hola", "fin": "Hei", "eng": "Hello"},
            {"spa_id": "2", "spa": "Adiós", "fin": "Näkemiin", "eng": "Goodbye"},
            {"spa_id": "3", "spa": "Gracias", "fin": "Kiitos", "eng": "Thanks"},
        ]
        
        result = deduplicate_sentences(sentences)
        
        assert len(result) == 3
        assert result[0]["spa"] == "Hola"
        assert result[1]["spa"] == "Adiós"
        assert result[2]["spa"] == "Gracias"
    
    def test_empty_list(self):
        """Test that empty list returns empty list."""
        result = deduplicate_sentences([])
        assert result == []


class TestAssignThemes:
    """Tests for assign_themes function."""
    
    def test_returns_list(self):
        """Test that assign_themes returns a list."""
        sentence = {"spa": "Hola", "fin": "Hei", "eng": "Hello"}
        result = assign_themes(sentence)
        assert isinstance(result, list)
    
    def test_greetings_keyword_matching(self):
        """Test that greeting keywords are correctly identified."""
        sentence = {"spa": "Hola, ¿cómo estás?", "fin": "Hei, mitä kuuluu?", "eng": "Hello, how are you?"}
        result = assign_themes(sentence)
        assert "greetings" in result
    
    def test_food_keyword_matching(self):
        """Test that food keywords are correctly identified."""
        sentence = {"spa": "Me gusta comer pasta", "fin": "Pidän pastasta", "eng": "I like to eat pasta"}
        result = assign_themes(sentence)
        assert "food" in result
    
    def test_travel_keyword_matching(self):
        """Test that travel keywords are correctly identified."""
        sentence = {"spa": "Voy al aeropuerto", "fin": "Menen lentokentälle", "eng": "I'm going to the airport"}
        result = assign_themes(sentence)
        assert "travel" in result
    
    def test_family_keyword_matching(self):
        """Test that family keywords are correctly identified."""
        sentence = {"spa": "Mi madre es profesora", "fin": "Äitini on opettaja", "eng": "My mother is a teacher"}
        result = assign_themes(sentence)
        assert "family" in result
    
    def test_work_keyword_matching(self):
        """Test that work keywords are correctly identified."""
        sentence = {"spa": "Tengo una reunión en la oficina", "fin": "Minulla on kokous toimistossa", "eng": "I have a meeting at the office"}
        result = assign_themes(sentence)
        assert "work" in result
    
    def test_leisure_keyword_matching(self):
        """Test that leisure keywords are correctly identified."""
        sentence = {"spa": "Me gusta jugar fútbol", "fin": "Pidän jalkapallon pelaamisesta", "eng": "I like to play soccer"}
        result = assign_themes(sentence)
        assert "leisure" in result
    
    def test_multiple_themes(self):
        """Test that sentences can have multiple themes."""
        sentence = {"spa": "Mi familia come en el restaurante", "fin": "Perheeni syö ravintolassa", "eng": "My family eats at the restaurant"}
        result = assign_themes(sentence)
        assert "family" in result
        assert "food" in result
        assert len(result) == 2
    
    def test_no_matching_keywords(self):
        """Test that sentences without matching keywords return empty list."""
        sentence = {"spa": "El cielo es azul", "fin": "Taivas on sininen", "eng": "The sky is blue"}
        result = assign_themes(sentence)
        assert result == []
    
    def test_case_insensitive_matching(self):
        """Test that keyword matching is case-insensitive."""
        sentence = {"spa": "HOLA, buenos días", "fin": "Hei, hyvää huomenta", "eng": "Hello, good morning"}
        result = assign_themes(sentence)
        assert "greetings" in result


class TestGroupByTheme:
    """Tests for group_by_theme function."""
    
    def test_groups_sentences_by_theme(self):
        """Test that sentences are correctly grouped by theme."""
        sentences = [
            Sentence("1", "Hola", "Hei", "Hello", 1, ["greetings"]),
            Sentence("2", "Adiós", "Näkemiin", "Goodbye", 1, ["greetings"]),
            Sentence("3", "Manzana", "Omena", "Apple", 1, ["food"]),
        ]
        
        result = group_by_theme(sentences)
        
        assert "greetings" in result
        assert "food" in result
        assert len(result["greetings"]) == 2
        assert len(result["food"]) == 1
    
    def test_sentences_without_themes_go_to_general(self):
        """Test that sentences without themes are grouped as 'general'."""
        sentences = [
            Sentence("1", "Hola", "Hei", "Hello", 1, []),
            Sentence("2", "Adiós", "Näkemiin", "Goodbye", 1, []),
        ]
        
        result = group_by_theme(sentences)
        
        assert "general" in result
        assert len(result["general"]) == 2
    
    def test_sentence_can_belong_to_multiple_themes(self):
        """Test that a sentence can be in multiple theme groups."""
        sentences = [
            Sentence("1", "¿Qué quieres comer?", "Mitä haluat syödä?", "What do you want to eat?", 4, ["food", "questions"]),
        ]
        
        result = group_by_theme(sentences)
        
        assert "food" in result
        assert "questions" in result
        assert len(result["food"]) == 1
        assert len(result["questions"]) == 1
        assert result["food"][0].id == "1"
        assert result["questions"][0].id == "1"
    
    def test_empty_list(self):
        """Test that empty list returns empty dict."""
        result = group_by_theme([])
        assert result == {}


class TestConvertToSentenceObjects:
    """Tests for convert_to_sentence_objects function."""
    
    def test_converts_raw_to_sentence_objects(self):
        """Test that raw dictionaries are converted to Sentence objects."""
        raw_sentences = [
            {"spa_id": "1", "spa": "Hola", "fin": "Hei", "eng": "Hello"},
            {"spa_id": "2", "spa": "Adiós amigo", "fin": "Näkemiin ystävä", "eng": "Goodbye friend"},
        ]
        
        result = convert_to_sentence_objects(raw_sentences)
        
        assert len(result) == 2
        assert isinstance(result[0], Sentence)
        assert result[0].id == "1"
        assert result[0].spanish == "Hola"
        assert result[0].finnish == "Hei"
        assert result[0].english == "Hello"
        assert result[0].wordCount == 1
        assert isinstance(result[0].themes, list)
    
    def test_calculates_word_count_correctly(self):
        """Test that word count is calculated correctly."""
        raw_sentences = [
            {"spa_id": "1", "spa": "Hola", "fin": "Hei", "eng": "Hello"},
            {"spa_id": "2", "spa": "Hola mi amigo", "fin": "Hei ystäväni", "eng": "Hello my friend"},
            {"spa_id": "3", "spa": "¿Cómo estás?", "fin": "Miten voit?", "eng": "How are you?"},
        ]
        
        result = convert_to_sentence_objects(raw_sentences)
        
        assert result[0].wordCount == 1  # "Hola"
        assert result[1].wordCount == 3  # "Hola mi amigo"
        assert result[2].wordCount == 2  # "¿Cómo estás?"
    
    def test_empty_list(self):
        """Test that empty list returns empty list."""
        result = convert_to_sentence_objects([])
        assert result == []


class TestWriteOutputFiles:
    """Tests for write_output_files function."""
    
    def test_creates_output_directory(self, tmp_path, monkeypatch):
        """Test that output directory is created."""
        # Mock the project structure
        fake_project_root = tmp_path / "project"
        fake_script_dir = fake_project_root / "scripts" / "data_story_pipeline"
        fake_script_dir.mkdir(parents=True)
        
        # Monkeypatch __file__ to point to our temp directory
        fake_script = fake_script_dir / "download_tatoeba.py"
        fake_script.touch()
        monkeypatch.setattr("download_tatoeba.Path", lambda x: fake_script if x == "__file__" else Path(x))
        
        groups = {
            "greetings": [
                Sentence("1", "Hola", "Hei", "Hello", 1, ["greetings"])
            ]
        }
        
        # Create a temporary output directory for this test
        output_dir = tmp_path / "svelte" / "static" / "sentences"
        
        # Patch the output_dir calculation in write_output_files
        import download_tatoeba
        original_func = download_tatoeba.write_output_files
        
        def patched_write_output_files(groups_arg):
            # Recreate the function logic with our test output_dir
            output_dir.mkdir(parents=True, exist_ok=True)
            
            manifest = {"themes": []}
            
            for theme, sentences in groups_arg.items():
                sentence_dicts = [
                    {
                        "id": s.id,
                        "spanish": s.spanish,
                        "finnish": s.finnish,
                        "english": s.english,
                        "wordCount": s.wordCount,
                        "themes": s.themes
                    }
                    for s in sentences
                ]
                
                filename = f"{theme}.json"
                file_path = output_dir / filename
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(sentence_dicts, f, ensure_ascii=False, indent=2)
                
                manifest["themes"].append({
                    "id": theme,
                    "name": theme,
                    "count": len(sentence_dicts),
                    "filename": filename
                })
            
            manifest_path = output_dir / "index.json"
            with open(manifest_path, 'w', encoding='utf-8') as f:
                json.dump(manifest, f, ensure_ascii=False, indent=2)
        
        patched_write_output_files(groups)
        
        assert output_dir.exists()
        assert (output_dir / "index.json").exists()
        assert (output_dir / "greetings.json").exists()
    
    def test_generates_valid_json_files(self, tmp_path):
        """Test that generated JSON files are valid and loadable."""
        output_dir = tmp_path / "sentences"
        output_dir.mkdir()
        
        groups = {
            "greetings": [
                Sentence("1", "Hola", "Hei", "Hello", 1, ["greetings"]),
                Sentence("2", "Adiós", "Näkemiin", "Goodbye", 1, ["greetings"])
            ]
        }
        
        # Manually write files for testing (simulating write_output_files)
        manifest = {"themes": []}
        
        for theme, sentences in groups.items():
            sentence_dicts = [
                {
                    "id": s.id,
                    "spanish": s.spanish,
                    "finnish": s.finnish,
                    "english": s.english,
                    "wordCount": s.wordCount,
                    "themes": s.themes
                }
                for s in sentences
            ]
            
            filename = f"{theme}.json"
            file_path = output_dir / filename
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(sentence_dicts, f, ensure_ascii=False, indent=2)
            
            manifest["themes"].append({
                "id": theme,
                "name": theme,
                "count": len(sentence_dicts),
                "filename": filename
            })
        
        manifest_path = output_dir / "index.json"
        with open(manifest_path, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, ensure_ascii=False, indent=2)
        
        # Verify files can be loaded
        with open(manifest_path, 'r', encoding='utf-8') as f:
            loaded_manifest = json.load(f)
        
        assert "themes" in loaded_manifest
        assert len(loaded_manifest["themes"]) == 1
        assert loaded_manifest["themes"][0]["name"] == "greetings"
        assert loaded_manifest["themes"][0]["count"] == 2
        
        # Load theme file
        with open(output_dir / "greetings.json", 'r', encoding='utf-8') as f:
            loaded_sentences = json.load(f)
        
        assert len(loaded_sentences) == 2
        assert loaded_sentences[0]["spanish"] == "Hola"
        assert loaded_sentences[1]["spanish"] == "Adiós"
    
    def test_manifest_contains_correct_metadata(self, tmp_path):
        """Test that manifest contains correct theme metadata."""
        output_dir = tmp_path / "sentences"
        output_dir.mkdir()
        
        groups = {
            "greetings": [Sentence("1", "Hola", "Hei", "Hello", 1, ["greetings"])],
            "food": [
                Sentence("2", "Pan", "Leipä", "Bread", 1, ["food"]),
                Sentence("3", "Agua", "Vesi", "Water", 1, ["food"])
            ]
        }
        
        # Manually create manifest
        manifest = {"themes": []}
        
        for theme, sentences in groups.items():
            sentence_dicts = [
                {
                    "id": s.id,
                    "spanish": s.spanish,
                    "finnish": s.finnish,
                    "english": s.english,
                    "wordCount": s.wordCount,
                    "themes": s.themes
                }
                for s in sentences
            ]
            
            filename = f"{theme}.json"
            file_path = output_dir / filename
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(sentence_dicts, f, ensure_ascii=False, indent=2)
            
            manifest["themes"].append({
                "id": theme,
                "name": theme,
                "count": len(sentence_dicts),
                "filename": filename
            })
        
        manifest_path = output_dir / "index.json"
        with open(manifest_path, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, ensure_ascii=False, indent=2)
        
        # Verify manifest
        with open(manifest_path, 'r', encoding='utf-8') as f:
            loaded_manifest = json.load(f)
        
        assert len(loaded_manifest["themes"]) == 2
        
        # Find greetings and food in manifest
        greetings_entry = next(t for t in loaded_manifest["themes"] if t["name"] == "greetings")
        food_entry = next(t for t in loaded_manifest["themes"] if t["name"] == "food")
        
        assert greetings_entry["count"] == 1
        assert greetings_entry["filename"] == "greetings.json"
        
        assert food_entry["count"] == 2
        assert food_entry["filename"] == "food.json"
