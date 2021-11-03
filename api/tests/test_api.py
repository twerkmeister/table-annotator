

def test_list_images(test_client):
    response = test_client.get("/01/images")
    images = response.json["images"]
    assert len(images) == 1


def test_get_image(test_client):
    response = test_client.get("/01/image/0100_5312606_1.jpg")
    assert response.status_code == 200
    assert len(response.data) > 10000
