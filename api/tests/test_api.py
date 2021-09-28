

def test_list_images(test_client):
    response = test_client.get("/images")
    images = response.json["images"]
    assert len(images) == 3
    assert "ducks_1.jpeg" in images


def test_get_image(test_client):
    response = test_client.get("/image/ducks_1.jpeg")
    assert response.status_code == 200
    assert len(response.data) > 10000
