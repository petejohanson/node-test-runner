module PolyfillTest exposing (suite)

import Expect
import Test exposing (..)


-- Native.Polyfilled is only for testing node-test-runner

import Native.Polyfilled


suite : Test
suite =
    [ plainExpectation ]
        |> concat


plainExpectation : Test
plainExpectation =
    test "" <|
        \() ->
            Expect.true "Polyfilling of `window` failed" True
