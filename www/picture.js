var photo1 = "1.jpg"
var photo2 = "2.jpg"
var currentPhoto = 1;

function changePhoto(photoId) {
	var photoElem = document.getElementById(photoId);
	if (currentPhoto == 1) {
		photoElem.src = photo2;
		currentPhoto = 2;
	} else {
		photoElem.src = photo1;
		currentPhoto = 1;
	}
}