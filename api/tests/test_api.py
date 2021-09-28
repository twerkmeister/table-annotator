

def test_images(test_client):
    response = test_client.get("/images")
    images = response.json["images"]
    assert len(images) == 3
    assert "ducks_1.jpeg" in images