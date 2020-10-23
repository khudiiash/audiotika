window.enablePostMessage = true;
window.postTitle = 'ASDA_SPARKFLOW';
window.postToken = '2F7A4C94F622FE8D15F2E30764AB852397D3EAD0EDF028E0B0752DF0473CB01F';

ad.preload([
    'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.5.1/gsap.min.js',
    'https://unpkg.com/flickity@2/dist/flickity.pkgd.min.js']);

$(document).on('adInteraction', function () {
    // If an interaction is detected clear the auto close
    //mraid.cancelAutoClose();
});

// Wait for the adReady or adClick event to initialize

function validURL(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return !!pattern.test(str);
}
function validName(str) {
    if (/^\s$|^%/.test(str) || !str) return false
    else return true
}



$(document).on('adReady', function () {


    $(document).on('adInteraction', function (e) {

    });

    $(document).on('adClick', function () {

    });

    gsap.set('.scene1,.scene2,.scene3', { autoAlpha: 0 });

    let animatedScenes = [1]

    setTimeout(function () {
        let currentScene = 1;


        if (!mraid.detectMobile()) {

            $('#landscapeSwitchScene1, #portraitSwitchScene1').mouseenter(() => showActiveButton(1))
            $('#landscapeSwitchScene1, #portraitSwitchScene1').mouseleave(() => hideActiveButton(1))
            $('#landscapeSwitchScene2, #portraitSwitchScene2').mouseenter(() => showActiveButton(2))
            $('#landscapeSwitchScene2, #portraitSwitchScene2').mouseleave(() => hideActiveButton(2))
            $('#landscapeSwitchScene3, #portraitSwitchScene3').mouseenter(() => showActiveButton(3))
            $('#landscapeSwitchScene3, #portraitSwitchScene3').mouseleave(() => hideActiveButton(3))

        }



        function showActiveButton(scene) {
            gsap.to(`#landscapeButtonActive${scene},#portraitButtonActive${scene}`, .1, { opacity: 1 })
        }

        function hideActiveButton(scene) {
            if (scene !== currentScene)
                gsap.to(`#landscapeButtonActive${scene},#portraitButtonActive${scene}`, .1, { opacity: 0 })
        }

        showActiveButton(1)




        const videoAutoplay = /true/.test("%videoAutoplay%")

        console.log('%cVideo Autoplay, ' + videoAutoplay, 'color: aquamarine')

        let sameVideoPosition = /true/.test('%sameVideoPosition%') && (/^[0-9]*$/.test('%landscapeVideoScene1_X%') || /^[0-9]*$/.test('%portraitVideoScene1_X%')) ? true : false
        let sameCarouselPosition = /true/.test('%sameCarouselPosition%') && (/^[0-9]*$/.test('%landscapeCarouselScene1_X%') || /^[0-9]*$/.test('%portraitCarouselScene1_X%')) ? true : false


        let videos = {
            landscape: {
                scene1: {
                    x: /^[0-9]*$/.test('%landscapeVideoScene1_X%') ? '%landscapeVideoScene1_X%' : -9999,
                    y: /^[0-9]*$/.test('%landscapeVideoScene1_Y%') ? '%landscapeVideoScene1_Y%' : -9999,
                    width: /^[0-9]*$/.test('%landscapeVideoScene1_Width%') ? '%landscapeVideoScene1_Width%' : 0,
                    height: /^[0-9]*$/.test('%landscapeVideoScene1_Height%') ? '%landscapeVideoScene1_Height%' : 0,
                },
                scene2: {
                    x: /^[0-9]*$/.test('%landscapeVideoScene2_X%') ? '%landscapeVideoScene2_X%' : sameVideoPosition ? '%landscapeVideoScene1_X%' : -9999,
                    y: /^[0-9]*$/.test('%landscapeVideoScene2_Y%') ? '%landscapeVideoScene2_Y%' : sameVideoPosition ? '%landscapeVideoScene1_Y%' : -9999,
                    width: /^[0-9]*$/.test('%landscapeVideoScene2_Width%') ? '%landscapeVideoScene2_Width%' : sameVideoPosition ? '%landscapeVideoScene1_Width%' : 0,
                    height: /^[0-9]*$/.test('%landscapeVideoScene2_Height%') ? '%landscapeVideoScene2_Height%' : sameVideoPosition ? '%landscapeVideoScene1_Height%' : 0,
                },
                scene3: {
                    x: /^[0-9]*$/.test('%landscapeVideoScene3_X%') ? '%landscapeVideoScene3_X%' : sameVideoPosition ? '%landscapeVideoScene1_X%' : -9999,
                    y: /^[0-9]*$/.test('%landscapeVideoScene3_Y%') ? '%landscapeVideoScene3_Y%' : sameVideoPosition ? '%landscapeVideoScene1_Y%' : -9999,
                    width: /^[0-9]*$/.test('%landscapeVideoScene3_Width%') ? '%landscapeVideoScene3_Width%' : sameVideoPosition ? '%landscapeVideoScene1_Width%' : 0,
                    height: /^[0-9]*$/.test('%landscapeVideoScene3_Height%') ? '%landscapeVideoScene3_Height%' : sameVideoPosition ? '%landscapeVideoScene1_Height%' : 0,
                }
            },
            portrait: {
                scene1: {
                    x: /^[0-9]*$/.test('%portraitVideoScene1_X%') ? '%portraitVideoScene1_X%' : -9999,
                    y: /^[0-9]*$/.test('%portraitVideoScene1_Y%') ? '%portraitVideoScene1_Y%' : -9999,
                    width: /^[0-9]*$/.test('%portraitVideoScene1_Width%') ? '%portraitVideoScene1_Width%' : 0,
                    height: /^[0-9]*$/.test('%portraitVideoScene1_Height%') ? '%portraitVideoScene1_Height%' : 0,
                },
                scene2: {
                    x: /^[0-9]*$/.test('%portraitVideoScene2_X%') ? '%portraitVideoScene2_X%' : sameVideoPosition ? '%portraitVideoScene1_X%' : -9999,
                    y: /^[0-9]*$/.test('%portraitVideoScene2_Y%') ? '%portraitVideoScene2_Y%' : sameVideoPosition ? '%portraitVideoScene1_Y%' : -9999,
                    width: /^[0-9]*$/.test('%portraitVideoScene2_Width%') ? '%portraitVideoScene2_Width%' : sameVideoPosition ? '%portraitVideoScene1_Width%' : 0,
                    height: /^[0-9]*$/.test('%portraitVideoScene2_Height%') ? '%portraitVideoScene2_Height%' : sameVideoPosition ? '%portraitVideoScene1_Height%' : 0,
                },
                scene3: {
                    x: /^[0-9]*$/.test('%portraitVideoScene3_X%') ? '%portraitVideoScene3_X%' : sameVideoPosition ? '%portraitVideoScene1_X%' : -9999,
                    y: /^[0-9]*$/.test('%portraitVideoScene3_Y%') ? '%portraitVideoScene3_Y%' : sameVideoPosition ? '%portraitVideoScene1_Y%' : -9999,
                    width: /^[0-9]*$/.test('%portraitVideoScene3_Width%') ? '%portraitVideoScene3_Width%' : sameVideoPosition ? '%portraitVideoScene1_Width%' : 0,
                    height: /^[0-9]*$/.test('%portraitVideoScene3_Height%') ? '%portraitVideoScene3_Height%' : sameVideoPosition ? '%portraitVideoScene1_Height%' : 0,
                }
            }
        }

        let carousels = {
            landscape: {
                scene1: {
                    x: /^[0-9]*$/.test('%landscapeCarouselScene1_X%') ? '%landscapeCarouselScene1_X%' : -9999,
                    y: /^[0-9]*$/.test('%landscapeCarouselScene1_Y%') ? '%landscapeCarouselScene1_Y%' : -9999,
                    width: /^[0-9]*$/.test('%landscapeCarouselScene1_Width%') ? '%landscapeCarouselScene1_Width%' : 0,
                    height: /^[0-9]*$/.test('%landscapeCarouselScene1_Height%') ? '%landscapeCarouselScene1_Height%' : 0,
                },
                scene2: {
                    x: /^[0-9]*$/.test('%landscapeCarouselScene2_X%') ? '%landscapeCarouselScene2_X%' : sameCarouselPosition ? '%landscapeCarouselScene1_X%' : -9999,
                    y: /^[0-9]*$/.test('%landscapeCarouselScene2_Y%') ? '%landscapeCarouselScene2_Y%' : sameCarouselPosition ? '%landscapeCarouselScene1_Y%' : -9999,
                    width: /^[0-9]*$/.test('%landscapeCarouselScene2_Width%') ? '%landscapeCarouselScene2_Width%' : sameCarouselPosition ? '%landscapeCarouselScene1_Width%' : 0,
                    height: /^[0-9]*$/.test('%landscapeCarouselScene2_Height%') ? '%landscapeCarouselScene2_Height%' : sameCarouselPosition ? '%landscapeCarouselScene1_Height%' : 0,
                },
                scene3: {
                    x: /^[0-9]*$/.test('%landscapeCarouselScene3_X%') ? '%landscapeCarouselScene3_X%' : sameCarouselPosition ? '%landscapeCarouselScene1_X%' : -9999,
                    y: /^[0-9]*$/.test('%landscapeCarouselScene3_Y%') ? '%landscapeCarouselScene3_Y%' : sameCarouselPosition ? '%landscapeCarouselScene1_Y%' : -9999,
                    width: /^[0-9]*$/.test('%landscapeCarouselScene3_Width%') ? '%landscapeCarouselScene3_Width%' : sameCarouselPosition ? '%landscapeCarouselScene1_Width%' : 0,
                    height: /^[0-9]*$/.test('%landscapeCarouselScene3_Height%') ? '%landscapeCarouselScene3_Height%' : sameCarouselPosition ? '%landscapeCarouselScene1_Height%' : 0,
                }
            },
            portrait: {
                scene1: {
                    x: /^[0-9]*$/.test('%portraitCarouselScene1_X%') ? '%portraitCarouselScene1_X%' : -9999,
                    y: /^[0-9]*$/.test('%portraitCarouselScene1_Y%') ? '%portraitCarouselScene1_Y%' : -9999,
                    width: /^[0-9]*$/.test('%portraitCarouselScene1_Width%') ? '%portraitCarouselScene1_Width%' : 0,
                    height: /^[0-9]*$/.test('%portraitCarouselScene1_Height%') ? '%portraitCarouselScene1_Height%' : 0,
                },
                scene2: {
                    x: /^[0-9]*$/.test('%portraitCarouselScene2_X%') ? '%portraitCarouselScene2_X%' : sameCarouselPosition ? '%portraitCarouselScene1_X%' : -9999,
                    y: /^[0-9]*$/.test('%portraitCarouselScene2_Y%') ? '%portraitCarouselScene2_Y%' : sameCarouselPosition ? '%portraitCarouselScene1_Y%' : -9999,
                    width: /^[0-9]*$/.test('%portraitCarouselScene2_Width%') ? '%portraitCarouselScene2_Width%' : sameCarouselPosition ? '%portraitCarouselScene1_Width%' : 0,
                    height: /^[0-9]*$/.test('%portraitCarouselScene2_Height%') ? '%portraitCarouselScene2_Height%' : sameCarouselPosition ? '%portraitCarouselScene1_Height%' : 0,
                },
                scene3: {
                    x: /^[0-9]*$/.test('%portraitCarouselScene3_X%') ? '%portraitCarouselScene3_X%' : sameCarouselPosition ? '%portraitCarouselScene1_X%' : -9999,
                    y: /^[0-9]*$/.test('%portraitCarouselScene3_Y%') ? '%portraitCarouselScene3_Y%' : sameCarouselPosition ? '%portraitCarouselScene1_Y%' : -9999,
                    width: /^[0-9]*$/.test('%portraitCarouselScene3_Width%') ? '%portraitCarouselScene3_Width%' : sameCarouselPosition ? '%portraitCarouselScene1_Width%' : 0,
                    height: /^[0-9]*$/.test('%portraitCarouselScene3_Height%') ? '%portraitCarouselScene3_Height%' : sameCarouselPosition ? '%portraitCarouselScene1_Height%' : 0,
                }
            }
        }


        const videoAppearTime = /\d+/.test("%videoAppearTime%")
            ? /\./.test("%videoAppearTime%") ? parseFloat("%videoAppearTime%") : parseInt("%videoAppearTime%")
            : 0;


        const tweenDuration = /\d+/.test("%tweenDuration%")
            ? /\./.test("%tweenDuration%") ? parseFloat("%tweenDuration%") : parseInt("%tweenDuration%")
            : .2;

        const tweenOffset = /^(?:\-|\+)=\.?\d+$/.test("%tweenOffset%") ? "%tweenOffset%" : '+=1';
        const hideVideoControls = /true/.test('%hideVideoControls%')


        $("#landscapeVideo_scene1").css({
            "left": videos.landscape.scene1.x + "px",
            "top": videos.landscape.scene1.y + "px",
            "width": videos.landscape.scene1.width + "px",
            "height": videos.landscape.scene1.height + "px"
        })
        $("#landscapeVideo_scene2").css({
            "left": videos.landscape.scene2.x + "px",
            "top": videos.landscape.scene2.y + "px",
            "width": videos.landscape.scene2.width + "px",
            "height": videos.landscape.scene2.height + "px"
        })
        $("#landscapeVideo_scene3").css({
            "left": videos.landscape.scene3.x + "px",
            "top": videos.landscape.scene3.y + "px",
            "width": videos.landscape.scene3.width + "px",
            "height": videos.landscape.scene3.height + "px"
        })

        $("#portraitVideo_scene1").css({
            "left": videos.portrait.scene1.x + "px",
            "top": videos.portrait.scene1.y + "px",
            "width": videos.portrait.scene1.width + "px",
            "height": videos.portrait.scene1.height + "px"
        })
        $("#portraitVideo_scene2").css({
            "left": videos.portrait.scene2.x + "px",
            "top": videos.portrait.scene2.y + "px",
            "width": videos.portrait.scene2.width + "px",
            "height": videos.portrait.scene2.height + "px"
        })
        $("#portraitVideo_scene3").css({
            "left": videos.portrait.scene3.x + "px",
            "top": videos.portrait.scene3.y + "px",
            "width": videos.portrait.scene3.width + "px",
            "height": videos.portrait.scene3.height + "px"
        });




        gsap.timeline()
            .set('.scrollClick1', { autoAlpha: 1 })
            .to(".background1.scene1", .5, { autoAlpha: 1 })
            .to(".background2.scene1", tweenDuration, { autoAlpha: 1 }, tweenOffset)
            .to(".background3.scene1", tweenDuration, { autoAlpha: 1 }, tweenOffset)
            .to(".background4.scene1", tweenDuration, { autoAlpha: 1 }, tweenOffset)
            .to(".background5.scene1", tweenDuration, { autoAlpha: 1 }, tweenOffset)
            .to(".background6.scene1", tweenDuration, { autoAlpha: 1 }, tweenOffset)
            .to(".background7.scene1", tweenDuration, { autoAlpha: 1 }, tweenOffset)
            .to(".background8.scene1", tweenDuration, { autoAlpha: 1 }, tweenOffset)
            .to(".background9.scene1", tweenDuration, { autoAlpha: 1 }, tweenOffset)
            .to(".background10.scene1", tweenDuration, { autoAlpha: 1 }, tweenOffset)


        gsap.timeline({ delay: .5 })
            .to(".landscapeCarousel.scene1,.portraitCarousel.scene1", .5, { autoAlpha: 1 })
            .to(".landscapeVideo.scene1, .portraitVideo.scene1", .5, { delay: videoAppearTime, autoAlpha: 1 })



        const v = window.SFVideoPlayers ? SFVideoPlayers['landscapeVideo_scene1'] : null;
        const v2 = window.SFVideoPlayers ? SFVideoPlayers['portraitVideo_scene1'] : null;



        if (hideVideoControls) $('.vp-controls').hide()

        if (videoAutoplay) {
            if (v) {
                if (v.isMuted()) v.play(false)
                else { v.toggleSound(); v.play(false) }
            } else console.log('No V')

            if (v2) {
                if (v2.isMuted()) v2.play(false)
                else { v2.toggleSound(); v2.play(false) }
            } else console.log('No V2')

        }




        gsap.to("section", { duration: .5, autoAlpha: 1 });


        // Carousels

        $("#landscapeCarouselScene1").css({
            "left": carousels.landscape.scene1.x + "px",
            "top": carousels.landscape.scene1.y + "px",
            "width": carousels.landscape.scene1.width + "px",
            "height": carousels.landscape.scene1.height + "px"
        })
        $("#landscapeCarouselScene2").css({
            "left": carousels.landscape.scene2.x + "px",
            "top": carousels.landscape.scene2.y + "px",
            "width": carousels.landscape.scene2.width + "px",
            "height": carousels.landscape.scene2.height + "px"
        })
        $("#landscapeCarouselScene3").css({
            "left": carousels.landscape.scene3.x + "px",
            "top": carousels.landscape.scene3.y + "px",
            "width": carousels.landscape.scene3.width + "px",
            "height": carousels.landscape.scene3.height + "px"
        })

        $("#portraitCarouselScene1").css({
            "left": carousels.portrait.scene1.x + "px",
            "top": carousels.portrait.scene1.y + "px",
            "width": carousels.portrait.scene1.width + "px",
            "height": carousels.portrait.scene1.height + "px"
        })
        $("#portraitCarouselScene2").css({
            "left": carousels.portrait.scene2.x + "px",
            "top": carousels.portrait.scene2.y + "px",
            "width": carousels.portrait.scene2.width + "px",
            "height": carousels.portrait.scene2.height + "px"
        })
        $("#portraitCarouselScene3").css({
            "left": carousels.portrait.scene3.x + "px",
            "top": carousels.portrait.scene3.y + "px",
            "width": carousels.portrait.scene3.width + "px",
            "height": carousels.portrait.scene3.height + "px"
        })


        console.log('getting carousel images')

        const carouselImage1_scene1 = "%carouselImage1_scene1%";
        const carouselImage2_scene1 = "%carouselImage2_scene1%";
        const carouselImage3_scene1 = "%carouselImage3_scene1%";
        const carouselImage4_scene1 = "%carouselImage4_scene1%";
        const carouselImage5_scene1 = "%carouselImage5_scene1%";
        const carouselImage6_scene1 = "%carouselImage6_scene1%";
        const carouselImage7_scene1 = "%carouselImage7_scene1%";
        const carouselImage8_scene1 = "%carouselImage8_scene1%";
        const carouselImage9_scene1 = "%carouselImage9_scene1%";
        const carouselImage10_scene1 = "%carouselImage10_scene1%";

        const carouselImage1_scene2 = "%carouselImage1_scene2%";
        const carouselImage2_scene2 = "%carouselImage2_scene2%";
        const carouselImage3_scene2 = "%carouselImage3_scene2%";
        const carouselImage4_scene2 = "%carouselImage4_scene2%";
        const carouselImage5_scene2 = "%carouselImage5_scene2%";
        const carouselImage6_scene2 = "%carouselImage6_scene2%";
        const carouselImage7_scene2 = "%carouselImage7_scene2%";
        const carouselImage8_scene2 = "%carouselImage8_scene2%";
        const carouselImage9_scene2 = "%carouselImage9_scene2%";
        const carouselImage10_scene2 = "%carouselImage10_scene2%";


        const carouselImage1_scene3 = "%carouselImage1_scene3%";
        const carouselImage2_scene3 = "%carouselImage2_scene3%";
        const carouselImage3_scene3 = "%carouselImage3_scene3%";
        const carouselImage4_scene3 = "%carouselImage4_scene3%";
        const carouselImage5_scene3 = "%carouselImage5_scene3%";
        const carouselImage6_scene3 = "%carouselImage6_scene3%";
        const carouselImage7_scene3 = "%carouselImage7_scene3%";
        const carouselImage8_scene3 = "%carouselImage8_scene3%";
        const carouselImage9_scene3 = "%carouselImage9_scene3%";
        const carouselImage10_scene3 = "%carouselImage10_scene3%";

        const carouselImages_scene1 = [carouselImage1_scene1, carouselImage2_scene1, carouselImage3_scene1, carouselImage4_scene1, carouselImage5_scene1, carouselImage6_scene1, carouselImage7_scene1, carouselImage8_scene1, carouselImage9_scene1, carouselImage10_scene1]
        const carouselImages_scene2 = [carouselImage1_scene2, carouselImage2_scene2, carouselImage3_scene2, carouselImage4_scene2, carouselImage5_scene2, carouselImage6_scene2, carouselImage7_scene2, carouselImage8_scene2, carouselImage9_scene2, carouselImage10_scene2]
        const carouselImages_scene3 = [carouselImage1_scene3, carouselImage2_scene3, carouselImage3_scene3, carouselImage4_scene3, carouselImage5_scene3, carouselImage6_scene3, carouselImage7_scene3, carouselImage8_scene3, carouselImage9_scene3, carouselImage10_scene3]
        const allCarousels = [carouselImages_scene1, carouselImages_scene2, carouselImages_scene3]




        allCarousels.forEach((carouselImages, index) => {


            for (let i = 0; i < carouselImages.length; i++) {
                console.log(carouselImages[i])
                if (validURL(carouselImages[i]) || validName(carouselImages[i])) {
                    console.log('%cImage URL PASS', 'color: yellowgreen')
                    $("#landscapeCarouselScene" + (index + 1)).append('<div class="carousel-cell"><img class="carouselImage" src=" ' + carouselImages[i] + ' " /></div>');
                    $("#portraitCarouselScene" + (index + 1)).append('<div class="carousel-cell"><img class="carouselImage" src=" ' + carouselImages[i] + ' " /></div>');

                } else {
                    console.log('%cNo Image', 'color: red')
                }
            }

            $(`#landscapeCarouselScene${index + 1} img.carouselImage`).css("width", carousels.landscape[`scene${index + 1}`].width + "px");
            $(`#portraitCarouselScene${index + 1} img.carouselImage`).css("width", carousels.portrait[`scene${index + 1}`].width + "px");


            setTimeout(function () {

                $(`#landscapeCarouselScene${index + 1}`).flickity({
                    imagesLoaded: true,
                    autoPlay: index === 0 && /true/.test('%autoPlayCarousel%')

                });

                $(`#portraitCarouselScene${index + 1}`).flickity({
                    imagesLoaded: true,
                    autoPlay: index === 0 && /true/.test('%autoPlayCarousel%')
                });


            }, 200);

        }) // Carousels




        function switchScene(scene) {
            let scenes = [1, 2, 3]
            // Pause videos if playing
            if (scene !== currentScene) {

                if (window.SFVideoPlayers && SFVideoPlayers['landscapeVideo_scene' + currentScene]) { SFVideoPlayers['landscapeVideo_scene' + currentScene].pause() }
                if (window.SFVideoPlayers && SFVideoPlayers['portraitVideo_scene' + currentScene]) { SFVideoPlayers['portraitVideo_scene' + currentScene].pause() };

                if (videoAutoplay && window.SFVideoPlayers) {
                    let v = SFVideoPlayers['landscapeVideo_scene' + scene]
                    let v2 = SFVideoPlayers['portraitVideo_scene' + scene]
                    if (v) {
                        if (v.isMuted()) v.play(false)
                        else { v.toggleSound(); v.play(false) }
                    } else console.log('No V')

                    if (v2) {
                        if (v2.isMuted()) v2.play(false)
                        else { v2.toggleSound(); v2.play(false) }
                    } else console.log('No V2')
                }



                currentScene = scene;

                scenes.forEach(n => {
                    if (n !== scene) {
                        gsap.set('.scene' + n, { autoAlpha: 0 })
                        hideActiveButton(n)

                    } else {
                        showActiveButton(n)
                    }
                })
                if (!animatedScenes.includes(scene)) {
                    animatedScenes.push(scene)

                    if (/true/.test('%autoPlayCarousel%')) {
                        $(`#landscapeCarouselScene${scene}`).flickity('playPlayer');
                        $(`#portraitCarouselScene${scene}`).flickity('playPlayer');
                    }
                    gsap.timeline()
                        .set('.scrollClick' + scene, { autoAlpha: 1 })
                        .to(".background1.scene" + scene, 0, { autoAlpha: 1 })
                        .to(".background2.scene" + scene, tweenDuration, { autoAlpha: 1 }, tweenOffset)
                        .to(".background3.scene" + scene, tweenDuration, { autoAlpha: 1 }, tweenOffset)
                        .to(".background4.scene" + scene, tweenDuration, { autoAlpha: 1 }, tweenOffset)
                        .to(".background5.scene" + scene, tweenDuration, { autoAlpha: 1 }, tweenOffset)
                        .to(".background6.scene" + scene, tweenDuration, { autoAlpha: 1 }, tweenOffset)
                        .to(".background7.scene" + scene, tweenDuration, { autoAlpha: 1 }, tweenOffset)
                        .to(".background8.scene" + scene, tweenDuration, { autoAlpha: 1 }, tweenOffset)
                        .to(".background9.scene" + scene, tweenDuration, { autoAlpha: 1 }, tweenOffset)
                        .to(".background10.scene" + scene, tweenDuration, { autoAlpha: 1 }, tweenOffset)
                    gsap.timeline()
                        .to(`.landscapeCarousel.scene${scene},.portraitCarousel.scene${scene}`, 0, { autoAlpha: 1 })
                        .to(`.landscapeVideo.scene${scene}, .portraitVideo.scene${scene}`, 0, { delay: videoAppearTime, autoAlpha: 1 })

                } else {
                    gsap.set('.scene' + scene, { autoAlpha: 1 })
                }
            }
        }

        $('.switchScene1').click(() => switchScene(1))
        $('.switchScene2').click(() => switchScene(2))
        $('.switchScene3').click(() => switchScene(3))


    }, 200);

});